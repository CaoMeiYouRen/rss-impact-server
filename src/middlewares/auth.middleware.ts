import { ConfigParams, SessionStore, auth } from 'express-openid-connect'
import { sessionOptions } from './session.middleware'
import { AUTH0_BASE_URL, AUTH0_CLIENT_ID, AUTH0_ISSUER_BASE_URL, AUTH0_SECRET, TIMEOUT, OIDC_RESPONSE_TYPE, OIDC_RESPONSE_MODE, OIDC_SCOPE, OIDC_AUTO_DETECT, OIDC_REDIRECT_URL } from '@/app.config'
import { detectOIDCConfig } from '@/utils/oidc-detector'

// 创建异步函数来初始化配置
async function createAuthConfig(): Promise<ConfigParams> {
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
        authRequired: false, // 可选，是否所有路由都需要认证
        routes: {
            login: false, // 禁用默认的 /login 路由
            logout: false, // 禁用默认的 /logout 路由
            callback: false, // 禁用默认的 /callback 路由
        },
        auth0Logout: true,
        secret: AUTH0_SECRET,
        clientSecret: AUTH0_SECRET, // 添加 clientSecret 字段
        baseURL: AUTH0_BASE_URL,
        clientID: AUTH0_CLIENT_ID,
        issuerBaseURL: AUTH0_ISSUER_BASE_URL,
        session: {
            store: sessionOptions.store as any as SessionStore,
            // cookie: sessionOptions.cookie as CookieConfigParams,
            // cookie: {
            //     secure: false,
            //     httpOnly: true,
            //     sameSite: 'lax',
            // },
        },
        httpTimeout: TIMEOUT,
        authorizationParams: {
            response_type: responseType,
            response_mode: responseMode,
            scope,
            redirect_uri: OIDC_REDIRECT_URL,
        },
    }

    // 根据响应类型调整客户端认证方法
    // if (responseType === 'code') {
    //     // 对于 authorization_code 流程，可能需要不同的客户端认证方法
    //     config.clientAuthMethod = 'client_secret_post' // 或者 'client_secret_basic'
    // }

    return config
}

// 默认配置（同步版本，用于兼容）
const defaultConfig: ConfigParams | null = AUTH0_SECRET ? {
    authRequired: false, // 可选，是否所有路由都需要认证
    routes: {
        login: false, // 禁用默认的 /login 路由
        logout: false, // 禁用默认的 /logout 路由
        callback: false, // 禁用默认的 /callback 路由
    },
    auth0Logout: true,
    secret: AUTH0_SECRET,
    clientSecret: AUTH0_SECRET, // 添加 clientSecret 字段
    baseURL: AUTH0_BASE_URL,
    clientID: AUTH0_CLIENT_ID,
    issuerBaseURL: AUTH0_ISSUER_BASE_URL,
    session: {
        store: sessionOptions.store as any as SessionStore,
        // cookie: sessionOptions.cookie as CookieConfigParams,
        // cookie: {
        //     secure: false,
        //     httpOnly: true,
        //     sameSite: 'lax',
        // },
    },
    httpTimeout: TIMEOUT,
    authorizationParams: {
        response_type: OIDC_RESPONSE_TYPE,
        response_mode: OIDC_RESPONSE_MODE,
        scope: OIDC_SCOPE,
        redirect_uri: OIDC_REDIRECT_URL,
    },
} : null

// 导出异步初始化的中间件
export const createAuthMiddleware = async () => {
    if (!AUTH0_SECRET) {
        throw new Error('AUTH0_SECRET is required for OIDC authentication')
    }
    const config = await createAuthConfig()
    return auth(config)
}

// auth router attaches /login, /logout, and /callback routes to the baseURL
// 只有在有必要的配置时才创建默认中间件
export const authMiddleware = defaultConfig ? auth(defaultConfig) : null
