# SQLite disk I/O error 排查

> 适用版本：`rss-impact-server@1.18.5+`
> 相关错误：`SqliteError: disk I/O error`、`SQLITE_IOERR_WRITE`、`cannot rollback - no transaction is active`

## 症状判断

| 现象 | 更可能的原因 |
| --- | --- |
| 查询正常、执行业务写入（UPDATE/INSERT）时报 `disk I/O error` | 基础镜像 musl 版本与宿主 seccomp 冲突（本文重点） |
| 完全无法打开数据库、`unable to open database file` | 数据目录不存在、路径错误、权限不足 |
| `database or disk is full` | 磁盘或 inode 耗尽 |
| `database is locked`、`SQLITE_BUSY` | 多进程同时写库，或旧容器未退出 |

“能读不能写”是最有辨识度的特征：SQLite 的读操作走 `pread`，写操作走 `pwrite`。

## 根因：Alpine 3.24 / musl 1.2.6 的 pwritev2

Alpine 3.24 将 musl 升级到 1.2.6。musl 自 [2024-03-14 的 pwrite 修改](https://git.musl-libc.org/cgit/musl/log/src/unistd/pwrite.c) 起，把 `pwrite()` 实现为：

```c
int r = __syscall_cp(SYS_pwritev2, fd, &iov, 1, ofs, ofs >> 32, RWF_NOAPPEND);
/* 只在这两种错误下回退到 pwrite */
if (r != -EOPNOTSUPP && r != -ENOSYS)
    return __syscall_ret(r);
return syscall_cp(SYS_pwrite, fd, buf, size, ofs);
```

`pwritev2` 与 `RWF_NOAPPEND` 都较新（`RWF_NOAPPEND` 在 Linux 6.9 进入内核）。如果宿主环境里的
`pwritev2` 被 **seccomp 以 EPERM 拦截**（旧版 Docker/containerd 的默认策略没有放行 `pwritev2`），
musl 不会回退到 `pwrite`，而是把 EPERM 直接返回；SQLite 将其映射为 `SQLITE_IOERR_WRITE`，
即 `disk I/O error`。读路径使用 `pread`，因此仍然正常。

旧镜像使用 Alpine 3.23 / musl 1.2.5，`pwrite()` 直接调用 `pwrite` 系统调用，不经过 `pwritev2`，
所以同样的宿主上不会出问题。

### 实测对比（本仓库复现结果）

| 基础镜像 | Alpine | musl | 写入使用的系统调用 | 模拟 `pwritev2=EPERM` |
| --- | --- | --- | --- | --- |
| `caomeiyouren/alpine-nodejs-minimize:alpine3.22-node24.16`（旧运行时） | 3.23.4 | 1.2.5 | 仅 `pwrite64` | 正常 |
| `node:24.22.1-alpine` | 3.24.3 | 1.2.6 | `pwritev2(RWF_NOAPPEND)` → `pwrite64` | `disk I/O error` |
| `node:24.22.1-alpine3.23`（当前使用） | 3.23.7 | 1.2.5 | 仅 `pwrite64` | 正常 |

端到端验证：同一份数据库与同一个 `PUT /api/feed` 请求，在 `node:24.22.1-alpine` +
`pwritev2=EPERM` 下登录会话写入即失败并返回 500；在 `node:24.22.1-alpine3.23` + 同样的
`pwritev2=EPERM` 下返回 200。

## 确认宿主是否存在该问题

以下命令不需要安装任何依赖，直接在新基础镜像里执行：

```sh
docker run --rm node:24.22.1-alpine node -e "
const fs = require('fs')
const fd = fs.openSync('/tmp/pwrite-probe', 'w')
try {
  fs.writeSync(fd, Buffer.from('x'), 0, 1, 0)
  console.log('WRITE_OK')
} catch (e) {
  console.log('WRITE_FAIL', e.code, e.message)
}
"
```

- 输出 `WRITE_OK` 表示宿主允许 `pwritev2`（或内核会回退），不是本问题。
- 输出 `WRITE_FAIL EPERM ...` 表示 `pwritev2` 被拦截，所有基于 Alpine 3.24 的镜像都会写库失败。

再做一次对照，确认是 seccomp 而不是文件系统：

```sh
docker run --rm --security-opt seccomp=unconfined node:24.22.1-alpine node -e "const fs=require('fs');const fd=fs.openSync('/tmp/p','w');try{fs.writeSync(fd,Buffer.from('x'),0,1,0);console.log('WRITE_OK')}catch(e){console.log('WRITE_FAIL',e.code,e.message)}"
```

若默认运行是 `WRITE_FAIL`、加上 `seccomp=unconfined` 后变为 `WRITE_OK`，即可锁定是 seccomp 拦截了 `pwritev2`。

有条件时可以用 strace 直接观察系统调用（可选）：

```sh
docker run --rm --cap-add=SYS_PTRACE --security-opt seccomp=unconfined --entrypoint sh node:24.22.1-alpine -c '
  apk add --no-cache strace >/dev/null
  cat > /tmp/w.js <<"EOF"
const fs = require("fs")
const fd = fs.openSync("/tmp/t", "w")
fs.writeSync(fd, Buffer.from("x"), 0, 1, 0)
EOF
  strace -f -e trace=pwritev2,pwrite64 node /tmp/w.js
'
```

Alpine 3.24 / musl 1.2.6 会先出现 `pwritev2(... RWF_NOAPPEND)`；返回 `EOPNOTSUPP` 或 `ENOSYS` 时会回退到 `pwrite64`，只有返回 `EPERM` 等其他错误时才会失败。

启动日志中出现 `SQLite 写入探测失败` 时，说明服务已经检测到该问题，日志里会给出同样的处理建议。

## 修复

### 1. 宿主侧（推荐，治本）

升级宿主 Docker/containerd 到默认 seccomp 策略已包含 `pwritev2` 的版本，然后重建容器即可。
无法升级时，可以为容器指定允许 `pwritev2` 的自定义 seccomp 配置。

仅用于验证根因的临时手段（会显著放宽隔离，不建议长期使用）：

```sh
docker run --security-opt seccomp=unconfined ...
```

### 2. 镜像侧（宿主无法升级时的规避）

使用 Alpine 3.23（musl 1.2.5）作为基础镜像。本仓库 Dockerfile 已默认使用：

```dockerfile
ARG NODE_IMAGE=node:24.22.1-alpine3.23
```

其他使用 `caomeiyouren/alpine-nodejs*` 的项目需要在共享基础镜像侧同样固定 Alpine 3.23，
或等待宿主运行时修复后再使用 Alpine 3.24。

若不需要 musl，也可以改用 glibc 基础镜像（如 `node:24.22.1-bookworm-slim`），
glibc 的 `pwrite` 不经过 `pwritev2`，代价是镜像体积增加。

### 3. 不要用 journal_mode 规避

`DATABASE_JOURNAL_MODE=delete` 与 `wal` 都通过 `pwrite` 写数据文件，不能绕过该问题；
journal 模式只影响并发与崩溃恢复行为。相关配置保留是为了适配共享文件系统，而不是修复
`disk I/O error`。

## journal 模式选择

默认使用 `delete`，对 bind mount 和大多数自建部署兼容性更好。

确认数据目录位于本地 ext4/xfs 等可靠文件系统时，可以启用 WAL 提升并发读性能：

```ini
DATABASE_JOURNAL_MODE='wal'
```

可选值：`delete`、`wal`。启动时会校验实际生效的模式，不匹配会在日志中输出错误。

## 其他可能原因

| 原因 | 说明 | 排查方式 |
| --- | --- | --- |
| 数据目录位于跨主机/虚拟化共享文件系统 | NFS、SMB、virtiofs/osxfs 对锁与 `fsync` 的支持不完整 | `findmnt -T <data>`、`docker inspect <container> --format '{{json .Mounts}}'` |
| 磁盘或 inode 耗尽 | 下载资源、日志、备份占满磁盘 | `df -h`、`df -i` |
| 宿主机磁盘 I/O 异常 | 硬盘、RAID、云盘返回 EIO | `dmesg -T \| grep -iE "I/O error\|ext4\|xfs\|nvme\|raid"` |
| 新旧容器同时写库 | 滚动部署期间两个进程同时打开数据库 | `docker ps` 确认没有重复容器 |
| 数据库文件被外部覆盖 | 备份/同步工具直接复制或清理数据库文件 | 检查备份脚本 |

## 立即处置

1. 检查磁盘与 inode：

   ```sh
   df -h
   df -i
   ```

2. 检查宿主机 I/O 错误：

   ```sh
   dmesg -T | grep -iE "I/O error|ext4|xfs|nvme|raid"
   ```

3. 停止容器，完整备份数据目录（包括 `database.sqlite-wal`、`database.sqlite-shm`）：

   ```sh
   docker compose stop server
   cp -a ./data ./data.backup-$(date +%Y%m%d%H%M%S)
   ```

4. 启动后确认日志中的 PRAGMA、磁盘空间与写入探测：

   ```text
   SQLite PRAGMA 配置完成: journal_mode=delete, synchronous=FULL, busy_timeout=10000
   SQLite 数据目录可用空间: 20480.00 MiB
   SQLite 写入探测通过
   ```

## 数据库检查

停止容器后可以用 Node.js 执行只读检查：

```sh
docker run --rm -v "$PWD/data:/data" -w /app --entrypoint node <image> -e "
const Database = require('better-sqlite3')
const db = new Database('/data/database.sqlite', { readonly: true })
console.log(db.pragma('quick_check', { simple: true }))
console.log(db.pragma('journal_mode', { simple: true }))
db.close()
"
```

`quick_check` 返回 `ok` 表示页结构正常。若返回其他内容，先保留备份再尝试恢复。

## 备份注意事项

WAL 模式下只复制 `database.sqlite` 可能丢失最近事务。正确做法：

- 停止容器后复制整个数据目录；或
- 使用 `sqlite3 database.sqlite ".backup '/path/to/backup.sqlite'"`。

## 代码侧加固

- 所有 SQLite 连接统一先设置 `busy_timeout=10000`，再切换 `journal_mode` 并校验实际值。
- `delete` 模式使用 `synchronous=FULL`，`wal` 模式使用 `synchronous=NORMAL`。
- 启动时在数据目录执行一次真实写入探测，失败时输出包含 `pwritev2` / seccomp 的排查提示。
- 启动时记录数据目录可用空间，低于 100 MiB 输出告警。
- RSS 抓取、Webhook 日志等关键读写增加针对 `disk I/O error` / `SQLITE_BUSY` / `SQLITE_IOERR` 的指数退避重试。
