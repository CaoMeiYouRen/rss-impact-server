import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, Method, AxiosRequestHeaders, ResponseType } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { isHttpURL, isSocksUrl } from './helper'
import { assertSafeUrl, createSafeAgents } from './ssrf-guard'

export interface AjaxConfig {
    url: string
    query?: Record<string, unknown>
    data?: Record<string | number | symbol, unknown> | Record<string | number | symbol, unknown>[]
    method?: Method
    headers?: AxiosRequestHeaders
    timeout?: number
    baseURL?: string
    responseType?: ResponseType
    proxyUrl?: string
}

const axiosInstance = axios.create({}) // 创建 axios 实例，防止全局污染

const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308]
const MAX_REDIRECTS = 5
const CONFIDENTIAL_HEADER_PATTERN = /^(?:(?:proxy-)?authorization|cookie)$/i

export function getHttpAgent(proxyUrl: string) {
    if (!proxyUrl) {
        return null
    }
    if (isHttpURL(proxyUrl)) {
        return new HttpsProxyAgent(proxyUrl)
    }
    if (isSocksUrl(proxyUrl)) {
        return new SocksProxyAgent(proxyUrl)
    }
    return null
}

/**
 * axios 接口封装
 *
 * 所有出站请求都会经过 SSRF 校验，并且手动跟随重定向，
 * 保证每一跳的目标地址都会被重新校验（axios 自带的自动重定向无法做到这一点）。
 *
 * @author CaoMeiYouRen
 * @export
 * @param {AjaxConfig} config
 * @returns {Promise<AxiosResponse<any>>}
 */
export async function ajax<T = any>(config: AjaxConfig): Promise<AxiosResponse<T>> {
    try {
        const { url, query = {}, data, method = 'GET', headers = {}, timeout = 10000, baseURL, responseType, proxyUrl } = config
        const targetUrl = baseURL ? new URL(url, baseURL).toString() : url
        const proxyAgent = getHttpAgent(proxyUrl)
        const agents = proxyAgent
            ? { httpAgent: proxyAgent, httpsAgent: proxyAgent }
            : createSafeAgents()
        return await requestWithSafeRedirects<T>({
            method,
            headers: {
                // 不声明 br，降低服务端返回 Brotli 压缩响应的概率。
                // 注意：忽略 Accept-Encoding 的服务端仍可能返回 br，且 axios 会按响应头自动解压；
                // 根治需要 Node.js >= 24.22.1（修复 CVE-2026-111497）。
                'Accept-Encoding': 'gzip, deflate',
                ...headers,
            },
            params: query,
            data,
            timeout,
            responseType,
            ...agents,
            proxy: false,
        }, targetUrl, Boolean(proxyAgent))
    } catch (error) {
        if (error.toJSON) {
            console.error(error.toJSON())
        } else {
            console.error(error)
        }
        throw error
    }
}

/**
 * 手动跟随重定向，每一跳都重新做 SSRF 校验。
 * 重定向语义尽量与 follow-redirects（axios 默认实现）保持一致。
 */
async function requestWithSafeRedirects<T>(config: AxiosRequestConfig, initialUrl: string, viaProxy: boolean): Promise<AxiosResponse<T>> {
    let currentUrl = initialUrl
    let currentMethod = String(config.method ?? 'GET').toUpperCase()
    let currentData = config.data
    let currentParams = config.params
    let currentHeaders = { ...(config.headers ?? {}) } as Record<string, unknown>

    for (let redirectCount = 0; ; redirectCount++) {
        // 直连时由 Agent 的 lookup 在连接阶段校验，避免 DNS rebinding；
        // 走代理时目标由代理解析，只能在这里做 DNS 预检。
        await assertSafeUrl(currentUrl, { resolve: viaProxy })
        const response = await axiosInstance<unknown, AxiosResponse<T>>(currentUrl, {
            ...config,
            method: currentMethod as Method,
            data: currentData,
            params: currentParams,
            headers: currentHeaders as AxiosRequestHeaders,
            maxRedirects: 0,
            validateStatus: (status) => (status >= 200 && status < 300) || REDIRECT_STATUS_CODES.includes(status),
        })
        currentParams = undefined
        if (!REDIRECT_STATUS_CODES.includes(response.status)) {
            if (response.status >= 300) { // 与 axios 默认行为一致：非 2xx 视为异常
                throw createStatusError(response)
            }
            return response
        }
        const rawLocation = response.headers?.location
        const location = Array.isArray(rawLocation) ? rawLocation[0] : rawLocation
        if (!location) {
            throw createStatusError(response)
        }
        if (redirectCount >= MAX_REDIRECTS) {
            throw new AxiosError(`重定向次数超过上限（${MAX_REDIRECTS}）`, AxiosError.ERR_FR_TOO_MANY_REDIRECTS, response.config, response.request, response)
        }
        // 释放重定向响应的连接，避免 responseType=stream 时泄漏
        destroyResponseData(response.data)
        const nextUrl = new URL(location, currentUrl).toString()
        const redirect = buildRedirectRequest({
            currentUrl,
            nextUrl,
            method: currentMethod,
            data: currentData,
            headers: currentHeaders,
        }, response.status)
        currentMethod = redirect.method
        currentData = redirect.data
        currentHeaders = redirect.headers
        currentUrl = nextUrl
    }
}

function buildRedirectRequest(request: {
    currentUrl: string
    nextUrl: string
    method: string
    data: unknown
    headers: Record<string, unknown>
}, statusCode: number) {
    const { currentUrl, nextUrl, method, data, headers } = request
    const nextHeaders = { ...headers }
    let nextMethod = method
    let nextData = data
    // RFC7231§6.4：301/302 的 POST 与 303 的非 GET/HEAD 请求改为 GET，并移除与请求体相关的头
    if (
        ((statusCode === 301 || statusCode === 302) && method === 'POST')
        || (statusCode === 303 && !/^(?:GET|HEAD)$/.test(method))
    ) {
        nextMethod = 'GET'
        nextData = undefined
        removeMatchingHeaders(nextHeaders, /^content-/i)
    }
    // 重定向后由 Node 重新生成 Host
    removeMatchingHeaders(nextHeaders, /^host$/i)
    const current = new URL(currentUrl)
    const next = new URL(nextUrl)
    const keepCredentials = (next.protocol === current.protocol || next.protocol === 'https:')
        && (next.host === current.host || (next.port === current.port && next.hostname.endsWith(`.${current.hostname}`)))
    if (!keepCredentials) {
        removeMatchingHeaders(nextHeaders, CONFIDENTIAL_HEADER_PATTERN)
    }
    return {
        method: nextMethod,
        data: nextData,
        headers: nextHeaders,
    }
}

function removeMatchingHeaders(headers: Record<string, unknown>, pattern: RegExp): void {
    Object.keys(headers).forEach((key) => {
        if (pattern.test(key)) {
            delete headers[key]
        }
    })
}

function destroyResponseData(data: unknown): void {
    const stream = data as { destroy?: () => void, resume?: () => void }
    if (typeof stream?.destroy === 'function') {
        stream.destroy()
        return
    }
    if (typeof stream?.resume === 'function') {
        stream.resume()
    }
}

function createStatusError(response: AxiosResponse): AxiosError {
    const code = response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST
    return new AxiosError(`Request failed with status code ${response.status}`, code, response.config, response.request, response)
}
