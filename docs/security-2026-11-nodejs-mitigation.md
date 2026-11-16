# Node.js 2026-11-11 安全更新修复评估

> 评估日期：2026-11-16
> 适用版本：`rss-impact-server@1.19.2`
> 关联公告：[Node.js 2026-11-11 Security Releases](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases)

## 结论

本次安全更新覆盖 22 / 24 / 26 三条版本线，修复版本为 `22.23.5` / `24.22.3` / `26.13.1`，
共 16 个 CVE，其中 7 个 HIGH。本仓库原先的运行时为 `24.22.1`，低于 `24.22.3`，属于受影响版本。

修复同样以**升级运行时**为准：Dockerfile 已切换到包含修复的 Node.js `26.13.1`，
`engines.node` 下限同步提到 `^22.23.5 || >=24.22.3`，构建期版本校验会拒绝低于修复版本的镜像。

## 影响本仓库的漏洞

| CVE | 等级 | 版本线 | 本仓库可达性 |
| --- | --- | --- | --- |
| CVE-2026-123863 | High | 22 / 24 / 26 | 需要 `node:http2`；本服务默认 HTTP/1.1，通常由前置代理终结 TLS |
| CVE-2026-123864 | High | 22 / 24 / 26 | 需要 Node 自己终结 TLS；当前部署在 Nginx / Cloudflare 之后 |
| CVE-2026-123865 | High | 22 / 24 / 26 | 同 HTTP/2，默认不可达 |
| CVE-2026-123866 | High | 22 / 24 / 26 | 同 HTTP/2，默认不可达 |
| CVE-2026-126051 | High | 22 / 24 / 26 | 需要 Node 终结 TLS |
| CVE-2026-123872 | High | 22 / 24 / 26 | 未启用 TLS 客户端证书重协商 |
| CVE-2026-123874 | High | 22 / 24 / 26 | 需要 `node:http2` 的 `respondWithFile()` |
| llhttp / undici / sqlite 依赖修复 | — | 22 / 24 / 26 | 走常规 HTTP 请求解析与数据库路径，**必须升级** |

即使 HTTP/2 与 TLS 相关条目在当前拓扑下不可达，依赖类修复仍会经过普通的 HTTP 请求解析路径，
与部署拓扑无关，因此运行时升级不可省略。

## 已实施的修改

| 文件 | 修改 |
| --- | --- |
| `Dockerfile` | 基础镜像改为 `caomeiyouren/alpine-nodejs:alpine3.23.8-node26.13.1`（官方 Node.js 26.13.1 的 musl 构建 + Alpine 3.23.8）；构建期校验基线同步到 `22.23.5` / `24.22.3` / `26.13.1` |
| `package.json` | `engines.node` 由 `^22.23.4 \|\| >=24.22.1` 改为 `^22.23.5 \|\| >=24.22.3` |
| `README.md` | 同步 Node.js 版本徽章与依赖要求 |
| `scripts/ci/Dockerfile.sqlite-test` | SQLite 写入测试的基础镜像默认值同步到新镜像 |
| `.github/dependabot.yml` | 增加 `docker` 生态 |

基础镜像选择 `caomeiyouren/alpine-nodejs` 的精确版本 tag，而不是 `node:26.13.1-alpine3.23`：
前者内置 git、pnpm 11，并带有 musl `pwrite` 门禁与 Node 版本门禁（本轮安全基线由本仓库的
构建期校验兜底）；tag 同时固定 Alpine 补丁版本与 Node 版本，便于审计。运行时仍可用 `--build-arg` 覆盖：

```sh
docker build --build-arg NODE_IMAGE=node:26.13.1-alpine3.23 -t rss-impact-server .
```

Dockerfile 保留 `ARG NODE_IMAGE`，但 Dependabot 只解析 `FROM` 直写且 tag 可解析出版本号的镜像，
`alpine3.23.8-node26.13.1` 这种 tag 不会被自动跟版，基础镜像升级需要手动修改。

## 版本线选择

本仓库运行时从 24 升级到 26，与 CI 使用的 `lts/*`（当前为 26.13.1，Lithium）保持一致，
避免出现「CI 跑 26、镜像跑 24」的偏差。Node.js 26 已是 Active LTS，后续安全补丁会持续发布。

## 验证

1. 构建镜像：

   ```sh
   docker build -t rss-impact-server:secfix .
   ```

2. 确认运行时的 Node.js 版本：

   ```sh
   docker run --rm --entrypoint node rss-impact-server:secfix -v
   ```

   预期输出 `v26.13.1`。若低于修复版本，Dockerfile 的构建期校验会直接失败。

3. 验证 SQLite 写入与启动自检：

   ```sh
   sh scripts/ci/test-docker-sqlite.sh
   pnpm run test:startup
   ```

4. 部署后在运行中的容器内复核 `node -v`，并回归 RSS 抓取、Webhook 推送、图片下载与 OIDC 登录。

## 残留风险

- 基础镜像使用自定义 tag，Dependabot 无法自动跟版，需要人工按安全公告更新；如需自动化，
  可以改用 `node:<version>-alpine3.23` 这类标准 tag，或增加定时检查 Docker Hub 的工作流。
- 若后续为服务直接开启 HTTP/2（`http2.createSecureServer` 或 h2c 入口），需要重新评估
  HTTP/2 相关 CVE 的可达性。

## 参考

- [Node.js 2026-11-11 Security Releases](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases)
- [Node.js v26.13.1 Release Notes](https://nodejs.org/en/blog/release/v26.13.1)
- [Node.js v24.22.3 Release Notes](https://nodejs.org/en/blog/release/v24.22.3)
- [Node.js v22.23.5 Release Notes](https://nodejs.org/en/blog/release/v22.23.5)
