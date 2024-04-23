import axios, { AxiosResponse, Method, AxiosRequestHeaders, ResponseType } from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { isHttpURL, isSocksUrl } from './helper'

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

export function getHttpAgent(proxyUrl: string) {
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
 * @author CaoMeiYouRen
 * @export
 * @param {AjaxConfig} config
 * @returns {Promise<AxiosResponse<any>>}
 */
export async function ajax<T = any>(config: AjaxConfig): Promise<AxiosResponse<T>> {
    try {
        const { url, query = {}, data, method = 'GET', headers = {}, timeout = 10000, baseURL, responseType, proxyUrl } = config
        const httpAgent = getHttpAgent(proxyUrl)
        const resp = await axiosInstance(url, {
            method,
            headers,
            params: query,
            data,
            timeout,
            baseURL,
            responseType,
            httpAgent,
            httpsAgent: httpAgent,
            proxy: false,
        })
        return resp
    } catch (error) {
        if (error.toJSON) {
            console.error(error.toJSON())
        } else {
            console.error(error)
        }
        throw error
    }
}
