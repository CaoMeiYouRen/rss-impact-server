import history from 'connect-history-api-fallback'
import { RequestHandler } from 'express'

/**
 * 是否为 API 请求
 *
 * @author CaoMeiYouRen
 * @export
 * @param {string} path
 */
export function isApiRequest(path: string) {
    return path === '/api' || path.startsWith('/api/')
}

const historyMiddleware = history({
    htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
})

/**
 * SPA 回退中间件
 *
 * history 在重写 req.url 时会丢掉 query string，导致 /api/custom-query/rss/:id?key=xxx 这类接口
 * 在带浏览器式 Accept 头时取不到 key，从而返回 403。因此 /api 请求直接放行，不进入 SPA 回退逻辑。
 *
 * @author CaoMeiYouRen
 * @export
 */
export const spaFallback: RequestHandler = (req, res, next) => {
    if (isApiRequest(req.path)) {
        return next()
    }
    return historyMiddleware(req, res, next)
}
