import axios, { type Method } from 'axios'
import { getHttpAgent } from './ajax'

/**
 * OpenAI 7.x 移除了 httpAgent，改为依赖 fetch。
 * 通过 axios + 现有的代理 Agent 实现一个 fetch 兼容函数，保持 http/https/socks 代理能力。
 */
export function createProxyFetch(proxyUrl?: string): typeof fetch | undefined {
    const agent = getHttpAgent(proxyUrl)
    if (!agent) {
        return undefined
    }
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let url: string
        if (typeof input === 'string') {
            url = input
        } else if (input instanceof URL) {
            url = input.toString()
        } else {
            url = input.url
        }
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
            httpAgent: agent,
            httpsAgent: agent,
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
