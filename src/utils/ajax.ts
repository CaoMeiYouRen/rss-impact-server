import axios, { AxiosResponse, Method, AxiosRequestHeaders, ResponseType } from 'axios'

export interface AjaxConfig {
    url: string
    query?: Record<string, unknown>
    data?: Record<string | number | symbol, unknown> | Record<string | number | symbol, unknown>[]
    method?: Method
    headers?: AxiosRequestHeaders
    timeout?: number
    baseURL?: string
    responseType?: ResponseType
}

// TODO 考虑添加代理配置功能
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
        const { url, query = {}, data, method = 'GET', headers = {}, timeout = 10000, baseURL, responseType } = config
        const resp = await axios(url, {
            method,
            headers,
            params: query,
            data,
            timeout,
            baseURL,
            responseType,
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
