# OIDC 兼容配置指南

本项目现在支持两种 OIDC 认证模式：

## 1. Auth0 兼容模式（默认）

适用于 Auth0 和其他支持 `id_token` + `form_post` 的 OIDC 提供商。

```bash
# 基本配置
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your_client_id
AUTH0_SECRET=your_client_secret
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com

# OIDC 配置（默认值，适用于 Auth0）
OIDC_RESPONSE_TYPE=id_token
OIDC_RESPONSE_MODE=form_post
OIDC_SCOPE=openid profile email
OIDC_AUTO_DETECT=false
```

## 2. 标准 OIDC 模式

适用于标准的 OIDC 服务端，使用 `authorization_code` 流程。

```bash
# 基本配置
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your_client_id
AUTH0_SECRET=your_client_secret
AUTH0_ISSUER_BASE_URL=http://localhost:3000

# OIDC 配置（标准 OIDC 模式）
OIDC_RESPONSE_TYPE=code
OIDC_RESPONSE_MODE=query
OIDC_SCOPE=openid profile email
OIDC_AUTO_DETECT=false
```

## 3. 自动检测模式

启用自动检测后，系统会尝试获取 OIDC 服务端的配置并自动选择最佳的认证参数。

```bash
# 基本配置
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your_client_id
AUTH0_SECRET=your_client_secret
AUTH0_ISSUER_BASE_URL=http://localhost:3000

# 启用自动检测
OIDC_AUTO_DETECT=true
```

## 安全要求

OIDC 回调由 `express-openid-connect` 统一处理，会校验 `state`、`nonce`、PKCE、`iss` 和 `aud`。在此基础上，本服务还有以下安全约束：

-   **只允许用已验证邮箱关联已有账号**：IdP 必须返回 `email_verified: true`，否则不会把该 OIDC 身份绑定到同邮箱的本地账号。
-   **未知 sub 必须携带 email**：缺少 email 的 token 会被拒绝，避免空查询条件命中任意用户。
-   **已绑定的账号不会被覆盖**：如果本地账号已经绑定其他 `auth0Id`，新的 OIDC 身份不能顶掉原绑定。
-   **不会自动信任未验证邮箱**：即使 IdP 允许未验证邮箱登录，也只能创建新用户，不能接管已有账号。

部署建议：

1. 不需要公开注册时，在 IdP 中关闭 Sign Ups。
2. 需要公开注册时，开启 “Require Email Verification”。
3. `ADMIN_EMAIL` 使用真实可控的邮箱，不要保留 `admin@example.com` 这类示例值。
4. 如果 IdP 不返回 `email_verified`，已有本地账号首次使用 OIDC 登录时会被拒绝，需要继续使用原登录方式；当前版本不提供自动关联。

## 配置说明

### 环境变量说明

-   `AUTH0_BASE_URL`: 应用程序的基础 URL
-   `AUTH0_CLIENT_ID`: OIDC 客户端 ID
-   `AUTH0_SECRET`: OIDC 客户端密钥
-   `AUTH0_ISSUER_BASE_URL`: OIDC 服务端的基础 URL
-   `OIDC_REDIRECT_URL`: 回调地址，默认 `{BASE_URL}/api/auth/callback`；必须与 `AUTH0_BASE_URL` 同源，否则 OIDC 中间件会拒绝初始化
-   `OIDC_RESPONSE_TYPE`: 响应类型（`id_token` 或 `code`）
-   `OIDC_RESPONSE_MODE`: 响应模式（`form_post` 或 `query`）
-   `OIDC_SCOPE`: OIDC 范围，必须包含 `email`，否则首次绑定/注册会因缺少邮箱被拒绝
-   `OIDC_AUTO_DETECT`: 是否启用自动检测

### 自动检测逻辑

当启用 `OIDC_AUTO_DETECT=true` 时，系统会：

1. 尝试获取 `{AUTH0_ISSUER_BASE_URL}/.well-known/openid-configuration`
2. 分析服务端支持的功能
3. 根据支持的功能选择最佳配置：
    - 如果支持 `code` + `query`：使用标准 OIDC 模式
    - 如果支持 `id_token` + `form_post`：使用 Auth0 兼容模式
    - 如果都支持：优先使用 Auth0 兼容模式（更简单）

### JWT 签名算法支持

回调中的 ID Token 由 `express-openid-connect` 校验，当前只接受 OIDC 标准的非对称签名算法（默认 `RS256`），并通过 IdP 的 JWKS 获取公钥。

-   `RS256`: 支持，推荐
-   `HS256`: 不支持
-   `none`: 不支持

不要在 IdP 中把 ID Token 签名算法改为 `none` 或共享密钥算法。

### 示例：为您的 OIDC 服务端配置

根据您提供的 OIDC 配置，建议使用以下设置：

```bash
AUTH0_BASE_URL=http://localhost:3000
AUTH0_CLIENT_ID=your_client_id
AUTH0_SECRET=your_client_secret
AUTH0_ISSUER_BASE_URL=http://localhost:3000

# 使用标准 OIDC 模式
OIDC_RESPONSE_TYPE=code
OIDC_RESPONSE_MODE=query
OIDC_SCOPE=openid profile email

# 或者启用自动检测
OIDC_AUTO_DETECT=true
```

## 兼容性说明

-   项目同时支持 Auth0 和标准 OIDC 服务端
-   自动检测功能可以简化配置过程
-   如果自动检测失败，系统会回退到默认配置
-   支持多种 JWT 签名算法，提高兼容性

## 故障排除

1. **自动检测失败**：检查 `AUTH0_ISSUER_BASE_URL` 是否正确，以及 `/.well-known/openid-configuration` 端点是否可访问
2. **JWT 验证失败**：检查签名算法和密钥配置是否正确
3. **回调失败**：确保回调 URL 配置正确，支持 GET 和 POST 两种方式
