import axios, { AxiosResponse, Method, AxiosRequestHeaders } from 'axios'

export interface AjaxConfig {
    url: string
    query?: Record<string, unknown>
    data?: Record<string, unknown>
    method?: Method
    headers?: AxiosRequestHeaders
    timeout?: number
    baseURL?: string
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
        const { url, query = {}, data = {}, method = 'GET', headers = {}, timeout = 10000, baseURL } = config
        const resp = await axios(url, {
            method,
            headers,
            params: query,
            data,
            timeout,
            baseURL,
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
