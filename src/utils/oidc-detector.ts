import { AUTH0_ISSUER_BASE_URL, OIDC_AUTO_DETECT } from '@/app.config'
import { ajax } from '@/utils/ajax'

export interface OIDCConfiguration {
    issuer: string
    authorization_endpoint: string
    token_endpoint: string
    userinfo_endpoint: string
    jwks_uri: string
    response_types_supported: string[]
    response_modes_supported: string[]
    grant_types_supported: string[]
    subject_types_supported: string[]
    id_token_signing_alg_values_supported: string[]
    token_endpoint_auth_methods_supported: string[]
    scopes_supported: string[]
    claims_supported: string[]
}

let cachedOIDCConfig: OIDCConfiguration | null = null

/**
 * 清除缓存的OIDC配置
 */
export function clearOIDCConfigCache(): void {
    cachedOIDCConfig = null
}

/**
 * 获取缓存的OIDC配置（不发起网络请求）
 */
export function getCachedOIDCConfiguration(): OIDCConfiguration | null {
    return cachedOIDCConfig
}

/**
 * 获取 OIDC 配置信息
 */
export async function getOIDCConfiguration(): Promise<OIDCConfiguration | null> {
    if (!AUTH0_ISSUER_BASE_URL || !OIDC_AUTO_DETECT) {
        return null
    }

    if (cachedOIDCConfig) {
        return cachedOIDCConfig
    }

    try {
        // 尝试获取 OIDC 配置
        const wellKnownUrl = `${AUTH0_ISSUER_BASE_URL}/.well-known/openid-configuration`
        const response = await ajax({
            url: wellKnownUrl,
            method: 'GET',
            timeout: 5000,
        })

        cachedOIDCConfig = response.data as OIDCConfiguration
        return cachedOIDCConfig
    } catch (error) {
        console.warn('Failed to fetch OIDC configuration:', error.message)
        return null
    }
}

/**
 * 检测 OIDC 服务端类型并返回推荐的配置
 */
export async function detectOIDCConfig() {
    const config = await getOIDCConfiguration()

    if (!config) {
        // 默认使用 Auth0 配置
        return {
            responseType: 'id_token',
            responseMode: 'form_post',
            isAuth0Compatible: true,
            isStandardOIDC: false,
            config,
        }
    }

    // 检查是否支持 authorization_code 流程
    const supportsAuthCode = config.response_types_supported?.includes('code')
    const supportsQuery = config.response_modes_supported?.includes('query')
    const supportsIdToken = config.response_types_supported?.includes('id_token')
    const supportsFormPost = config.response_modes_supported?.includes('form_post')

    // 判断服务端类型
    const isAuth0Compatible = supportsIdToken && supportsFormPost
    const isStandardOIDC = supportsAuthCode && supportsQuery

    // 根据支持的功能选择最佳配置
    let responseType = 'id_token'
    let responseMode = 'form_post'

    if (isStandardOIDC && !isAuth0Compatible) {
        // 标准 OIDC 服务端，优先使用 authorization_code 流程
        responseType = 'code'
        responseMode = 'query'
    } else if (isAuth0Compatible) {
        // Auth0 兼容的服务端，使用 id_token 流程
        responseType = 'id_token'
        responseMode = 'form_post'
    }

    return {
        responseType,
        responseMode,
        isAuth0Compatible,
        isStandardOIDC,
        config,
    }
}
