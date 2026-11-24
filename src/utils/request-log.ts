const DEFAULT_MAX_LENGTH = 8 * 1024

export interface RequestErrorLog {
    message?: string
    code?: string
    statusCode?: number
    response?: unknown
}

/**
 * 限制写入日志的值大小，避免超大响应体导致数据库写入失败或日志膨胀。
 */
export function truncateLogValue(value: unknown, maxLength = DEFAULT_MAX_LENGTH): unknown {
    if (value === null || typeof value === 'undefined') {
        return value
    }
    if (typeof value === 'string') {
        return value.length > maxLength ? `${value.slice(0, maxLength)}...（已截断）` : value
    }
    let text: string
    try {
        text = JSON.stringify(value)
    } catch {
        return String(value)
    }
    if (typeof text === 'undefined' || text.length <= maxLength) {
        return value
    }
    return {
        truncated: true,
        preview: text.slice(0, maxLength),
    }
}

/**
 * 构造可安全写入日志的错误信息。
 *
 * 只保留 message/code/状态码与响应体，避免把 axios 请求配置（可能包含 Authorization 等请求头）写入数据库。
 */
export function buildRequestErrorLog(error: any, maxLength = DEFAULT_MAX_LENGTH): RequestErrorLog {
    const response = error?.response
    return {
        message: error?.message,
        code: error?.code,
        statusCode: response?.status,
        response: truncateLogValue(response?.data, maxLength),
    }
}
