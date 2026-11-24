import axios, { type Method } from 'axios'
import { getHttpAgent } from './ajax'
import { assertSafeUrl } from './ssrf-guard'

function getRequestUrl(input: RequestInfo | URL): string {
    if (typeof input === 'string') {
        return input
    }
    if (input instanceof URL) {
        return input.toString()
    }
    return input.url
}

/**
 * OpenAI 7.x 移除了 httpAgent，改为依赖 fetch。
 * 通过 axios + 现有的代理 Agent 实现一个 fetch 兼容函数，保持 http/https/socks 代理能力。
 *
 * 所有请求都会先经过 SSRF 校验；没有配置代理时直接复用原生 fetch，保持流式响应等原有行为。
 */
export function createProxyFetch(proxyUrl?: string): typeof fetch {
    const proxyAgent = getHttpAgent(proxyUrl)
    if (!proxyAgent) {
        const originalFetch = globalThis.fetch.bind(globalThis)
        return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            await assertSafeUrl(getRequestUrl(input), { resolve: true })
            return originalFetch(input, init)
        }
    }
    const agents = { httpAgent: proxyAgent, httpsAgent: proxyAgent }
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = getRequestUrl(input)
        await assertSafeUrl(url, { resolve: true })
        const headers: Record<string, string> = {}
        new Headers(init?.headers).forEach((value, key) => {
            headers[key] = value
        })
        const response = await axios.request({
            url,
            method: (init?.method || 'GET') as Method,
            headers,
            data: init?.body,
            signal: init?.signal as AbortSignal,
            ...agents,
            responseType: 'text',
            validateStatus: () => true,
        })
        return new Response(response.data, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers as HeadersInit,
        })
    }
}
