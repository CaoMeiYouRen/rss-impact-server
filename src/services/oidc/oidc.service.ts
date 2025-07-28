import { Injectable, Logger } from '@nestjs/common'
import { ajax } from '@/utils/ajax'
import { getOIDCConfiguration, getCachedOIDCConfiguration, OIDCConfiguration } from '@/utils/oidc-detector'
import { AUTH0_CLIENT_ID, AUTH0_SECRET, OIDC_REDIRECT_URL } from '@/app.config'
import { JwtPayload } from '@/interfaces/auth0'

export interface TokenResponse {
    access_token: string
    token_type: string
    expires_in?: number
    id_token?: string
    refresh_token?: string
    scope?: string
}

@Injectable()
export class OIDCService {
    private readonly logger = new Logger(OIDCService.name)
    private cachedConfig: OIDCConfiguration | null = null

    /**
     * 获取OIDC配置
     */
    async getConfig(): Promise<OIDCConfiguration | null> {
        // 优先使用缓存的配置
        if (this.cachedConfig) {
            return this.cachedConfig
        }

        // 尝试从全局缓存获取
        const globalCachedConfig = getCachedOIDCConfiguration()
        if (globalCachedConfig) {
            this.cachedConfig = globalCachedConfig
            return this.cachedConfig
        }

        // 最后才发起网络请求
        this.cachedConfig = await getOIDCConfiguration()
        return this.cachedConfig
    }

    /**
     * 使用授权码换取访问令牌
     */
    async exchangeCodeForTokens(code: string, state?: string, codeVerifier?: string): Promise<TokenResponse> {
        const config = await this.getConfig()
        if (!config) {
            throw new Error('无法获取OIDC配置')
        }

        const tokenEndpoint = config.token_endpoint
        if (!tokenEndpoint) {
            throw new Error('OIDC配置中缺少token_endpoint')
        }

        const tokenData: Record<string, string> = {
            grant_type: 'authorization_code',
            client_id: AUTH0_CLIENT_ID,
            client_secret: AUTH0_SECRET,
            code,
            redirect_uri: OIDC_REDIRECT_URL,
        }

        if (codeVerifier) {
            tokenData.code_verifier = codeVerifier
        }

        this.logger.debug('Token exchange request:', {
            tokenEndpoint,
            clientId: AUTH0_CLIENT_ID,
            redirectUri: OIDC_REDIRECT_URL,
            hasCode: !!code,
            hasState: !!state,
            hasCodeVerifier: !!codeVerifier,
        })

        try {
            // 构建form-encoded数据
            const formData = Object.entries(tokenData)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&')

            const response = await ajax<TokenResponse>({
                url: tokenEndpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                } as any,
                data: formData as any,
                timeout: 10000,
            })

            this.logger.debug('Token exchange response status:', response.status)
            return response.data
        } catch (error) {
            const errorData = error?.response?.data
            this.logger.error('Token exchange failed:', errorData || error)

            // 如果有具体的错误描述，使用它
            if (errorData?.error_description) {
                throw new Error(`Token exchange failed: ${errorData.error_description} (${errorData.error})`)
            } else if (errorData?.error) {
                throw new Error(`Token exchange failed: ${errorData.error}`)
            } else {
                throw new Error(`Token exchange failed: ${error.message}`)
            }
        }
    }

    /**
     * 使用访问令牌获取用户信息
     */
    async getUserInfo(accessToken: string): Promise<JwtPayload> {
        const config = await this.getConfig()
        if (!config) {
            throw new Error('无法获取OIDC配置')
        }

        const userinfoEndpoint = config.userinfo_endpoint
        if (!userinfoEndpoint) {
            throw new Error('OIDC配置中缺少userinfo_endpoint')
        }

        try {
            const response = await ajax<JwtPayload>({
                url: userinfoEndpoint,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                } as any,
                timeout: 10000,
            })

            this.logger.debug('User info response status:', response.status)
            return response.data
        } catch (error) {
            this.logger.error('Get user info failed:', error)
            throw new Error(`Get user info failed: ${error.message}`)
        }
    }

    /**
     * 处理标准OIDC授权码流程
     */
    async processAuthorizationCode(code: string, state?: string, codeVerifier?: string): Promise<JwtPayload> {
        // 1. 使用授权码换取访问令牌
        const tokenResponse = await this.exchangeCodeForTokens(code, state, codeVerifier)

        // 2. 如果有id_token，直接解析它
        if (tokenResponse.id_token) {
            try {
                // 简单解析JWT (不验证签名)
                const [header, payload, signature] = tokenResponse.id_token.split('.')
                const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString())
                this.logger.debug('Decoded id_token payload:', decodedPayload)
                return decodedPayload as JwtPayload
            } catch (error) {
                this.logger.warn('Failed to decode id_token, fallback to userinfo endpoint:', error)
            }
        }

        // 3. 使用访问令牌从userinfo端点获取用户信息
        return this.getUserInfo(tokenResponse.access_token)
    }
}
