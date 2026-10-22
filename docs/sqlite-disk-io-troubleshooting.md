# SQLite disk I/O error 排查

> 适用版本：`rss-impact-server@1.18.5+`
> 相关错误：`SqliteError: disk I/O error`、`SQLITE_IOERR`、`SQLITE_IOERR_WRITE`

## 典型原因

按发生概率排序：

| 原因 | 说明 |
| --- | --- |
| 数据目录位于跨主机/虚拟化共享文件系统 | Docker Desktop 的 virtiofs/osxfs、NFS、SMB、部分 NAS 挂载无法可靠支持 SQLite WAL 依赖的 `-shm` 内存映射与 POSIX 锁 |
| 磁盘或 inode 耗尽 | 下载资源、日志、备份占满磁盘后，SQLite 写入会失败 |
| 宿主机磁盘 I/O 异常 | 硬盘、RAID、云盘出现 EIO，`dmesg` 中通常有对应记录 |
| 部署时新旧容器同时写库 | 滚动/重叠部署期间两个进程同时打开数据库，WAL 检查点可能短暂失败 |
| 数据库文件或 `-wal`/`-shm` 被外部删除、覆盖 | 备份脚本、同步工具直接复制或清理数据库文件 |

WAL 模式要求所有访问进程位于同一台主机，并依赖 `-shm` 共享内存。普通 bind mount 在 Linux 本地磁盘上通常可用，但跨虚拟机或网络文件系统时并不可靠。

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

3. 确认数据目录的文件系统类型：

   ```sh
   findmnt -T /path/to/data
   docker inspect <container> --format '{{json .Mounts}}'
   ```

4. 停止容器，完整备份数据目录（包括 `database.sqlite-wal`、`database.sqlite-shm`）：

   ```sh
   docker compose stop server
   cp -a ./data ./data.backup-$(date +%Y%m%d%H%M%S)
   ```

5. 如果数据目录位于网络/共享文件系统，迁移到本地磁盘或 Docker 命名卷后再启动。

6. 启动后确认日志中的 PRAGMA 与实际模式：

   ```text
   SQLite PRAGMA 配置完成: journal_mode=delete, synchronous=FULL, busy_timeout=10000
   ```

## journal 模式选择

默认使用 `delete`，兼容性最好，适合 Docker bind mount 和大多数自建部署。

确认数据目录位于本地 ext4/xfs 等可靠文件系统时，可以启用 WAL 提升并发读性能：

```ini
DATABASE_JOURNAL_MODE='wal'
```

可选值：`delete`、`wal`。启动时会校验实际生效的模式，不匹配会在日志中输出错误。

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
- 启动时记录数据目录可用空间，低于 100 MiB 输出告警。
- RSS 抓取、Webhook 日志等关键读写增加针对 `disk I/O error` / `SQLITE_BUSY` / `SQLITE_IOERR` 的指数退避重试。
