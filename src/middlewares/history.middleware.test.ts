import { Request } from 'express'
import { isApiRequest, spaFallback } from './history.middleware'

const BROWSER_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
const RSS_ACCEPT = 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'

function mockRequest(url: string, accept: string) {
    return {
        method: 'GET',
        url,
        path: url.split('?')[0],
        headers: { accept },
    } as unknown as Request
}

describe('isApiRequest', () => {
    it('/api 及其子路径应识别为 API 请求', () => {
        expect(isApiRequest('/api')).toBe(true)
        expect(isApiRequest('/api/')).toBe(true)
        expect(isApiRequest('/api/custom-query/rss/13')).toBe(true)
    })

    it('相似前缀不应识别为 API 请求', () => {
        expect(isApiRequest('/apiculture')).toBe(false)
        expect(isApiRequest('/feed')).toBe(false)
        expect(isApiRequest('/')).toBe(false)
    })
})

describe('spaFallback', () => {
    it('浏览器式 Accept 的 API 请求不应被重写，query string 必须保留', () => {
        const url = '/api/custom-query/rss/13?key=custom-query-key:8f197580-be7f-464f-9701-7975c6cfe1db'
        const req = mockRequest(url, BROWSER_ACCEPT)
        const next = jest.fn()

        spaFallback(req, {} as any, next)

        expect(req.url).toBe(url)
        expect(next).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith()
    })

    it('RSS 客户端请求 API 时同样保留 query string', () => {
        const url = '/api/custom-query/rss/13?key=custom-query-key:8f197580-be7f-464f-9701-7975c6cfe1db'
        const req = mockRequest(url, RSS_ACCEPT)
        const next = jest.fn()

        spaFallback(req, {} as any, next)

        expect(req.url).toBe(url)
        expect(next).toHaveBeenCalledTimes(1)
    })

    it('非 API 的浏览器式请求仍应回退到 index.html', () => {
        const req = mockRequest('/some/spa/route', BROWSER_ACCEPT)
        const next = jest.fn()

        spaFallback(req, {} as any, next)

        expect(req.url).toBe('/index.html')
        expect(next).toHaveBeenCalledTimes(1)
    })

    it('非 API 且不接受 HTML 的请求不应回退', () => {
        const req = mockRequest('/feed.xml', RSS_ACCEPT)
        const next = jest.fn()

        spaFallback(req, {} as any, next)

        expect(req.url).toBe('/feed.xml')
        expect(next).toHaveBeenCalledTimes(1)
    })
})
