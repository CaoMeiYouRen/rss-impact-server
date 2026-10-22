# Node.js 2026-10-21 安全更新修复评估

> 评估日期：2026-10-22
> 适用版本：`rss-impact-server@1.18.5`
> 关联公告：[Node.js 2026-10-21 Security Releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)

## 结论

本服务属于本次安全更新中的 P0 对象：镜像钉死在 `alpine3.22-node24.16`，同时通过 axios 访问用户配置的 RSS、Webhook、OIDC 地址，并下载文章内的任意图片，满足"旧运行时 + 不可信输入 + 公网服务"三个条件。

修复以**升级运行时**为准：Dockerfile 已切换到包含修复的 Node.js `24.22.1`，并增加构建期版本校验。仅调整 `Accept-Encoding` 或 axios 解压选项不能根治问题。

## 影响本仓库的漏洞

| CVE | 等级 | 版本线 | 本仓库可达路径 |
| --- | --- | --- | --- |
| CVE-2026-111497 | High | 22 / 24 / 26 | axios 自动解压 RSS、Webhook、OIDC、图片响应中的 Brotli 内容 |
| CVE-2026-105482 | High | 22 / 24 / 26 | 代理、RSS、Webhook、OIDC 域名解析；本仓库未直接调用 `dns.resolve` |
| CVE-2026-105483 | High | 24 / 26 | 访问第三方 HTTPS 地址时的证书主机名校验 |
| CVE-2026-106069 | High | 22 / 24 / 26 | 同上，主机名宽松解析为 IP 时绕过校验 |
| CVE-2026-106072 | Medium | 22 / 24 / 26 | 非规范 IPv4 主机名的证书校验 |
| CVE-2026-105481 | Medium | 22 / 24 / 26 | axios 默认开启 keep-alive，存在连接复用面 |
| CVE-2026-106074 | Medium | 22 / 24 / 26 | 不使用 startup snapshot / SEA，不受影响 |
| CVE-2026-106073 | Low | 22 / 24 / 26 | 未启用 `--permission`，不受影响 |

修复版本：`22.23.4` / `24.22.1` / `26.12.1`。

## Brotli 路径说明

axios 1.18 在 `lib/adapters/http.js` 中根据响应的 `content-encoding` 自动选择解压器，`br` 会调用 `zlib.createBrotliDecompress`。因此：

- 修改请求头只能降低服务端返回 Brotli 的概率，不能阻止忽略 `Accept-Encoding` 的服务端返回 `br`。
- `decompress: false` 可以关闭自动解压，但会让 JSON、文本和 `responseType: 'stream'` 的下载逻辑全部拿到压缩字节，需要自行解压，无法作为无侵入的临时开关。
- 本仓库的 `download()` 使用流式响应，同样会经过上述解压管线。

## 已实施的修改

| 文件 | 修改 |
| --- | --- |
| `Dockerfile` | 基础镜像由 `caomeiyouren/alpine-nodejs:alpine3.22-node24.16` 改为 `node:24.22.1-alpine`；增加构建期版本校验，低于修复版本时直接失败 |
| `package.json` | `engines.node` 由 `>=20` 改为 `^22.23.4 \|\| >=24.22.1` |
| `README.md` | 同步 Node.js 版本要求 |
| `src/utils/ajax.ts` | 默认请求头改为 `Accept-Encoding: gzip, deflate`，减少 Brotli 响应；保留调用方覆盖能力 |

Dockerfile 保留 `NODE_IMAGE` 构建参数。待自建镜像 `caomeiyouren/alpine-nodejs` 重建到 24.22.1 后，可用以下方式切回：

```sh
docker build --build-arg NODE_IMAGE=caomeiyouren/alpine-nodejs:<新 tag> -t rss-impact-server .
```

## 部署与验证

1. 构建镜像：

   ```sh
   docker build -t rss-impact-server:secfix .
   ```

2. 确认构建产物的 Node.js 版本为 `v24.22.1`：

   ```sh
   docker run --rm --entrypoint node rss-impact-server:secfix -v
   ```

   预期输出 `v24.22.1`。若低于该版本，Dockerfile 的构建期校验会直接失败。

3. 重新部署，并在运行中的容器内复核：

   ```sh
   docker exec <container> node -v
   ```

4. 部署后回归：RSS 抓取、Webhook 推送、图片下载、OIDC 登录各验证一次。

推送到 `master` 后，`Publish Docker Image` 工作流会自动构建并部署；也可以手动触发。

## 无法立即重建时的临时措施

这些措施只能降低被利用概率，不能替代升级：

- 限制容器出站访问，仅放行 RSS、Webhook、OIDC 所需的域名，阻断任意地址抓取。
- 暂停来源不可信的订阅源和 Webhook，尤其是允许匿名配置的实例。
- 不要依赖修改 `Accept-Encoding` 请求头作为防护；服务端或中间人仍可返回 `br`。
- 如需在旧运行时上运行，可将抓取类请求隔离到无密钥、无数据库权限的独立容器。

## 残留风险

- TLS 主机名校验与 DNS NUL 截断问题只能通过升级运行时解决，临时网络限制无法覆盖。
- `caomeiyouren/alpine-nodejs`、`-minimize` 系列镜像仍为 24.18.x，其他使用该底座的服务需要单独重建。
- 本仓库的 `Accept-Encoding` 调整仅降低触发概率，最终防护仍以 Node.js 版本为准。

## 参考

- [Node.js 2026-10-21 Security Releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- [Node.js v24.22.1 Release Notes](https://nodejs.org/en/blog/release/v24.22.1)
- [Node.js v22.23.4 Release Notes](https://nodejs.org/en/blog/release/v22.23.4)
- [Node.js v26.12.1 Release Notes](https://nodejs.org/en/blog/release/v26.12.1)
