import { ConfigParams, SessionStore, auth } from 'express-openid-connect'
import { sessionOptions } from './session.middleware'
import { AUTH0_BASE_URL, AUTH0_CLIENT_ID, AUTH0_ISSUER_BASE_URL, AUTH0_SECRET, TIMEOUT, OIDC_RESPONSE_TYPE, OIDC_RESPONSE_MODE, OIDC_SCOPE, OIDC_AUTO_DETECT, OIDC_REDIRECT_URL } from '@/app.config'
import { detectOIDCConfig } from '@/utils/oidc-detector'
import { OIDCUserService } from '@/services/oidc/oidc-user.service'
import { JwtPayload } from '@/interfaces/auth0'
import { ISession } from '@/interfaces/session'
import { getRandomCode } from '@/utils/helper'

/**
 * 从 OIDC_REDIRECT_URL 推导 SDK 的回调路径。
 *
 * express-openid-connect 会把 routes.callback 拼在 baseURL 后面，
 * 因此这里必须返回相对于 AUTH0_BASE_URL 的路径，而不是完整 URL。
 */
function resolveCallbackPath(): string {
    if (!AUTH0_BASE_URL) {
        return '/api/auth/callback'
    }
    const base = new URL(AUTH0_BASE_URL)
    const callback = new URL(OIDC_REDIRECT_URL)
    if (base.origin !== callback.origin) {
        throw new Error(`OIDC_REDIRECT_URL (${OIDC_REDIRECT_URL}) 必须与 AUTH0_BASE_URL (${AUTH0_BASE_URL}) 同源`)
    }
    const basePath = base.pathname.replace(/\/+$/, '')
    let callbackPath = callback.pathname
    if (basePath && basePath !== '/' && callbackPath.startsWith(basePath)) {
        callbackPath = callbackPath.slice(basePath.length)
    }
    if (!callbackPath.startsWith('/')) {
        callbackPath = `/${callbackPath}`
    }
    return callbackPath || '/api/auth/callback'
}

/**
 * 创建 OIDC 中间件配置。
 */
async function createAuthConfig(oidcUserService: OIDCUserService): Promise<ConfigParams> {
    if (!AUTH0_SECRET) {
        throw new Error('AUTH0_SECRET is required for OIDC authentication')
    }

    let responseType = OIDC_RESPONSE_TYPE
    let responseMode = OIDC_RESPONSE_MODE
    const scope = OIDC_SCOPE

    // 如果启用了自动检测，尝试检测 OIDC 服务端类型
    if (OIDC_AUTO_DETECT) {
        try {
            const detectionResult = await detectOIDCConfig()
            responseType = detectionResult.responseType
            responseMode = detectionResult.responseMode

            console.log('OIDC 服务端检测结果:', {
                responseType: detectionResult.responseType,
                responseMode: detectionResult.responseMode,
                isAuth0Compatible: detectionResult.isAuth0Compatible,
                isStandardOIDC: detectionResult.isStandardOIDC,
                hasTokenEndpoint: !!detectionResult.config?.token_endpoint,
                hasUserinfoEndpoint: !!detectionResult.config?.userinfo_endpoint,
            })
        } catch (error) {
            console.warn('OIDC 自动检测失败，使用默认配置:', error.message)
        }
    }

    const config: ConfigParams = {
        authRequired: false,
        routes: {
            login: false, // 禁用默认的 /login 路由
            logout: false, // 禁用默认的 /logout 路由
            // 交由 express-openid-connect 处理回调，统一校验 state/nonce/PKCE
            callback: resolveCallbackPath(),
        },
        auth0Logout: true,
        secret: AUTH0_SECRET,
        clientSecret: AUTH0_SECRET,
        baseURL: AUTH0_BASE_URL,
        clientID: AUTH0_CLIENT_ID,
        issuerBaseURL: AUTH0_ISSUER_BASE_URL,
        session: {
            store: sessionOptions.store as any as SessionStore,
        },
        httpTimeout: TIMEOUT,
        authorizationParams: {
            response_type: responseType,
            response_mode: responseMode,
            scope,
            // redirect_uri 交给 SDK 用 baseURL + routes.callback 生成，
            // 避免授权请求和 token 交换使用不同的 redirect_uri。
        },
        afterCallback: async (req, _res, oidcSession, state) => {
            const payload = req.oidc.user as JwtPayload
            // 先完成校验/绑定，失败时不要破坏当前会话
            const user = await oidcUserService.resolve(payload)
            // 校验通过后再轮换应用会话 ID，防止会话固定
            await new Promise<void>((resolve, reject) => {
                req.session.regenerate((err) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    resolve()
                })
            })
            await oidcUserService.attachSession(user, req.session as ISession)
            state.returnTo = `/?state=oidc_login_${getRandomCode(16)}`
            return oidcSession
        },
    }

    return config
}

/**
 * 创建 OIDC 中间件。
 */
export const createAuthMiddleware = async (oidcUserService: OIDCUserService) => {
    if (!AUTH0_SECRET) {
        throw new Error('AUTH0_SECRET is required for OIDC authentication')
    }
    const config = await createAuthConfig(oidcUserService)
    return auth(config)
}
