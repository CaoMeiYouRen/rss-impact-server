import { ConfigParams, SessionStore, auth } from 'express-openid-connect'
import { sessionOptions } from './session.middleware'
import { AUTH0_BASE_URL, AUTH0_CLIENT_ID, AUTH0_ISSUER_BASE_URL, AUTH0_SECRET, TIMEOUT, __PROD__ } from '@/app.config'

const config: ConfigParams = {
    authRequired: false, // 可选，是否所有路由都需要认证
    routes: {
        login: false, // 禁用默认的 /login 路由
        logout: false, // 禁用默认的 /logout 路由
        // callback: false, // 禁用默认的 /callback 路由
    },
    auth0Logout: true,
    secret: AUTH0_SECRET,
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
        response_type: 'id_token',
        response_mode: 'form_post', // form_post
        scope: 'openid profile email',
        // request_uri: `${AUTH0_BASE_URL}/auth/callback`,
    },
}

// auth router attaches /login, /logout, and /callback routes to the baseURL
export const authMiddleware = auth(config)
