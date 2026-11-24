# Security Policy/安全策略

## 支持范围

- 最新 Release（当前为 `1.19.6`）与 `master` 最新提交提供安全修复。
- 旧版本不再维护，安全修复优先以 **patch 版本**发布。
- 历史与近期公告见 [Security Advisories](https://github.com/CaoMeiYouRen/rss-impact-server/security/advisories)，近期包括 OIDC 账号接管与 Webhook SSRF，均已在对应 patch 版本修复。

## 安全原则

1. **以真实信任边界为准**：跨用户、跨权限、跨网络边界的问题属于安全漏洞；单用户自托管实例中管理员操作自身资源，通常不属于。
2. **默认安全**：敏感能力默认关闭或默认拒绝，例如出站访问默认禁止私网与云元数据地址，需要时再显式开启。
3. **修复可验证**：安全修复必须包含回归测试，并说明影响面、兼容性与迁移方式。
4. **协同披露**：先修复、再公开，未修复前不披露漏洞细节。

## 报告漏洞

请通过 GitHub 私密漏洞报告提交，不要公开创建 Issue、Discussion 或 PR：

👉 [报告安全问题](https://github.com/CaoMeiYouRen/rss-impact-server/security/advisories/new)

报告请至少说明：

- 摘要与影响；
- 受影响版本/commit 与影响组件；
- 前置条件（账号角色、多用户、注册/OIDC/demo 等）；
- 最小复现步骤、实际结果与预期结果；
- 影响评估与脱敏后的证据；
- 可选：建议修复、CVSS/CWE、致谢方式。

请只在自己的实例或测试环境验证，不进行横向移动或持久化；不要提交真实凭据；同一问题只提交一次。

## 处理与披露

- 3 个工作日内确认收到，7 个工作日内完成初步判定。
- 修复完成后发布 patch 版本，并在 GitHub Security Advisory 公布；必要时通过 GitHub CNA 申请 CVE。
- 采用协同披露：修复发布后公开细节；如需更长缓冲期，请在报告中说明。
- 经报告者同意后，会在公告中致谢。

## 安全修复约定

- 提交遵循 [贡献指南](./CONTRIBUTING.md) 的约定式提交规范；安全修复使用 `fix(security): ...`，以便发布 patch 版本。
- 一个提交对应一个逻辑修复，并附带覆盖原漏洞路径的回归测试。
- 涉及默认行为收紧时，同步更新配置示例、部署文档与升级说明。
- 公告发布前，不在公开提交或 PR 中附带可直接利用的 PoC。

## 部署基线

- 修改 `SESSION_SECRET`、`ADMIN_PASSWORD`，关闭不必要的 `ENABLE_REGISTER` / `ENABLE_DEMO_ACCOUNT`。
- 通过反向代理提供 TLS，避免直接暴露服务端口。
- 按需配置 `SSRF_ALLOWED_CIDRS`，不要长期关闭 SSRF 防护。
- 在容器或主机层限制不必要的出站访问。

更多说明见 [部署文档](./docs/deploy.md) 与 [OIDC 兼容配置指南](./docs/oidc-compatibility.md)。

## English Summary

- Supported: latest release and `master`. Older releases are unsupported; fixes ship as patch releases.
- Report privately via GitHub Security Advisories. Do not open public issues or PRs.
- Include affected version, component, prerequisites, minimal reproduction, impact, and redacted evidence.
- Security fixes use `fix(security): ...` and include regression tests. Disclosure is coordinated after a patched release.
