# Security Policy/安全策略

## 支持的版本

| 版本 | 支持状态 |
| --- | --- |
| 最新 Release（当前为 `1.19.6`） | ✅ 支持 |
| `master` 分支最新提交 | ✅ 支持（不保证稳定） |
| 低于最新 Release 的版本 | ❌ 不再提供安全修复，请先升级 |

安全修复优先以 **patch 版本**发布。生产环境请保持更新，并关注 [Releases](https://github.com/CaoMeiYouRen/rss-impact-server/releases) 与 [Security Advisories](https://github.com/CaoMeiYouRen/rss-impact-server/security/advisories)。

## 安全模型与范围

RssImpact 是一个可自部署、支持多用户的应用。判断一个问题是否属于安全漏洞，以其是否跨越了**真实存在的信任边界**为准：

- **在范围内**：普通用户读取、修改或删除其他用户的数据；绕过鉴权或权限校验；未授权访问管理接口；SSRF、命令注入、路径穿越、XSS、越权绑定账号等。
- **在范围内**：多用户实例中，低权限用户（包括 `demo` 账号）能够影响其他用户、服务器本身或服务器所在网络。
- **通常不在范围内**：需要管理员权限、且管理员就是唯一部署者的操作。若实例存在管理员与非管理员之间的实际边界（共享实例、演示站、开放注册、OIDC 多用户），则该边界内的越权仍在范围内。
- **部署方责任**：`SESSION_SECRET`、`ADMIN_PASSWORD` 使用默认或示例值，开启公开注册或演示账号，将服务直接暴露在公网且未做访问控制等，属于部署配置问题；相关安全问题仍欢迎报告，但会结合部署前提评估。

## 报告漏洞

请通过 **GitHub 私密漏洞报告**提交，不要公开创建 Issue、Discussion 或 PR：

👉 [报告安全问题](https://github.com/CaoMeiYouRen/rss-impact-server/security/advisories/new)

提交前请确认：

- 已在**最新 Release 或 master** 上复现；旧版本问题请先升级验证。
- 只在自己的实例或测试环境验证，不要测试他人的生产实例。
- 不进行横向移动、持久化、下载无关数据等超出证明漏洞所需范围的操作。
- 报告中不要包含真实凭据、Token、Cookie 或他人隐私数据；如已泄露，请立即轮换。
- 同一问题请只提交一次，补充信息可在原报告中更新。

## 报告格式要求

为便于快速复现和定级，报告至少包含以下内容：

1. **摘要**：一句话说明漏洞类型、影响对象和后果，例如“普通用户可通过 Webhook 访问云元数据并读取响应”。
2. **受影响版本**：版本号或 commit，并注明是否在最新 `master` 上复现。
3. **影响组件**：路由、文件、配置项或功能入口。
4. **前置条件**：账号角色（匿名/普通用户/管理员）、是否开启注册、OIDC、演示账号、多用户部署、反向代理或代理配置等。
5. **复现步骤**：最小且确定性的步骤，附请求样例（`curl` / HTTP 报文）或脚本。
6. **实际结果与预期结果**：分别说明当前行为和应有行为。
7. **影响评估**：可读取、修改或删除哪些数据，是否跨用户，是否可触达内网、云元数据或其他服务。
8. **证据**：日志、截图、响应片段。敏感内容必须脱敏，可使用 `<redacted>` 或示例值替代。
9. **建议修复**（可选）：修复思路、需要覆盖的调用链或回归测试建议。
10. **CVSS / CWE**（可选）：便于定级；最终评级由维护者确认。
11. **披露与致谢**：是否希望公开致谢，以及署名或主页链接。

推荐模板：

```markdown
### 摘要

### 受影响版本

### 影响组件

### 前置条件

### 复现步骤

### 实际结果

### 预期结果

### 影响评估

### 证据（已脱敏）

### 建议修复（可选）

### CVSS / CWE（可选）

### 披露与致谢
```

## 处理流程与时间线

| 阶段 | 目标时间 |
| --- | --- |
| 确认收到报告 | 3 个工作日内 |
| 初步判定（有效 / 需要补充 / 不受理） | 7 个工作日内 |
| 修复并发布 patch 版本 | 视复杂度尽快完成，通常在 30 天内 |
| 发布 Security Advisory | 修复版本发布后 |
| 申请 CVE | 视影响范围决定，通过 GitHub CNA 申请 |

维护者会在私密报告中同步进展。若报告无效、属于重复问题或信息不足，会说明原因；需要补充信息时会列出具体项。

## 披露政策

- 采用**协同披露**：修复版本发布后，再公开 Security Advisory 与漏洞细节。
- 默认在修复发布后公开；如需更长的缓冲期，请在报告中说明理由。
- 未经维护者同意，请勿在修复发布前公开漏洞细节或利用代码。
- 修复发布后，经报告者同意，会在 Advisory 中致谢。

## 安全修复提交规范

安全修复同样遵循 Conventional Commits，并额外遵守：

- 使用 `fix(security): ...` 作为提交类型，确保 semantic-release 发布 **patch** 版本；不要使用 `feat(security)`，避免误触发 minor 版本。
- 测试、文档分别使用 `test(security): ...`、`docs(security): ...`；安全修复不要使用 `chore` 或省略 scope。
- 一个提交只对应一个逻辑修复，修复与回归测试放在同一提交或相邻提交中。
- 提交正文说明影响面、修复策略、兼容性开关与迁移方式；公开提交中不要附带可直接利用的 PoC。
- 必须补充能够覆盖原漏洞路径的回归测试（`*.test.ts`），并确保 `lint`、`typecheck`、`test`、`build` 全部通过。
- Advisory 公布后，可在提交正文中引用 `Refs: GHSA-xxxx-xxxx-xxxx`；公布前不要在公开提交中暴露未修复细节。
- 涉及默认行为收紧（如默认禁止访问私网）时，必须在同一提交中更新 `.env`、`docs/deploy.md` 和升级说明。

## 近期安全公告

| Advisory | 等级 | 摘要 | 影响版本 | 修复版本 |
| --- | --- | --- | --- | --- |
| [GHSA-3gh4-3h59-mpm2](https://github.com/CaoMeiYouRen/rss-impact-server/security/advisories/GHSA-3gh4-3h59-mpm2) | Critical (9.8) | OIDC 回调按未验证邮箱关联账号，导致账号接管 | `>= 1.16.0, < 1.19.5` | `1.19.5` |
| [GHSA-m3f9-m868-qvpc](https://github.com/CaoMeiYouRen/rss-impact-server/security/advisories/GHSA-m3f9-m868-qvpc) | High (8.5) | Webhook URL 可触发 SSRF，访问内网与云元数据并读回响应 | `<= 1.19.5` | `1.19.6` |

## 安全部署基线

- 修改 `SESSION_SECRET` 与 `ADMIN_PASSWORD`，不要使用示例值。
- 非演示环境关闭 `ENABLE_REGISTER` 与 `ENABLE_DEMO_ACCOUNT`。
- 通过反向代理提供 TLS，避免将服务端口直接暴露在公网。
- 按需配置 `SSRF_ALLOWED_CIDRS`，不要长期关闭 SSRF 防护。
- 在容器或主机层限制不必要的出站访问，尤其是云元数据网段。
- 多用户实例遵循最小权限原则，定期审查用户与 Hook 配置。
- 关注 Dependabot、Code Scanning 与 Security Advisories，及时升级。

更多部署与认证安全说明见 [部署文档](./docs/deploy.md) 与 [OIDC 兼容配置指南](./docs/oidc-compatibility.md)。

## English Summary

- **Supported versions**: the latest release (currently `1.19.6`) and the latest `master` commits. Older releases are unsupported.
- **Reporting**: use [GitHub private vulnerability reporting](https://github.com/CaoMeiYouRen/rss-impact-server/security/advisories/new). Do not open public issues or PRs.
- **Required report fields**: summary, affected version/commit, component, prerequisites, minimal reproduction, actual vs expected result, impact, redacted evidence, optional fix suggestion, optional CVSS/CWE, and credit preference.
- **Process**: acknowledgement within 3 business days, initial triage within 7 business days, patch release and coordinated disclosure afterwards. CVEs are requested through the GitHub CNA when appropriate.
- **Security fix commits**: use `fix(security): ...` so that a patch release is produced, include regression tests, and avoid publishing exploit details before the advisory.
- **Scope**: issues that cross a real trust boundary (including multi-user instances, demo accounts, and open registration) are in scope. Administrator-only actions on a single-user self-hosted instance are generally not.
