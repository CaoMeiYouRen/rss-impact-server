import http from 'http'
import { AddressInfo } from 'net'

describe('ajax SSRF guard', () => {
    let server: http.Server
    let baseUrl: string
    const hits: string[] = []

    beforeAll(async () => {
        server = http.createServer((req, res) => {
            hits.push(`${req.method} ${req.url}`)
            if (req.url === '/ok') {
                res.end('ok')
                return
            }
            if (req.url === '/redirect') {
                res.writeHead(302, { Location: '/ok' })
                res.end()
                return
            }
            if (req.url === '/redirect-metadata') {
                res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data/' })
                res.end()
                return
            }
            if (req.url === '/redirect-post') {
                res.writeHead(302, { Location: '/echo' })
                res.end()
                return
            }
            if (req.url === '/redirect-loop') {
                res.writeHead(302, { Location: '/redirect-loop' })
                res.end()
                return
            }
            if (req.url === '/echo') {
                let body = ''
                req.on('data', (chunk) => {
                    body += chunk
                })
                req.on('end', () => {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ method: req.method, body }))
                })
                return
            }
            if (req.url === '/error') {
                res.writeHead(500, { 'Content-Type': 'text/plain' })
                res.end('boom')
                return
            }
            res.writeHead(404)
            res.end()
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        const { port } = server.address() as AddressInfo
        baseUrl = `http://127.0.0.1:${port}`
    })

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
    })

    afterEach(() => {
        delete process.env.SSRF_ALLOW_PRIVATE_NETWORK
        delete process.env.SSRF_ALLOWED_CIDRS
    })

    async function importAjax(allowPrivate = false) {
        jest.resetModules()
        if (allowPrivate) {
            process.env.SSRF_ALLOW_PRIVATE_NETWORK = 'true'
        }
        const { ajax } = await import('./ajax')
        return ajax
    }

    it('should block loopback requests by default', async () => {
        const ajax = await importAjax()
        await expect(ajax({ url: `${baseUrl}/ok` })).rejects.toMatchObject({ name: 'SsrfBlockedError' })
    })

    it('should allow loopback requests when private network is enabled', async () => {
        const ajax = await importAjax(true)
        const response = await ajax({ url: `${baseUrl}/ok` })
        expect(response.data).toBe('ok')
    })

    it('should follow redirects when every hop is allowed', async () => {
        const ajax = await importAjax(true)
        const response = await ajax({ url: `${baseUrl}/redirect` })
        expect(response.data).toBe('ok')
        expect(response.status).toBe(200)
    })

    it('should re-validate every redirect target', async () => {
        const ajax = await importAjax(true)
        await expect(ajax({ url: `${baseUrl}/redirect-metadata` })).rejects.toMatchObject({ name: 'SsrfBlockedError' })
    })

    it('should change POST to GET on 302 redirect', async () => {
        const ajax = await importAjax(true)
        const response = await ajax<{ method: string, body: string }>({
            url: `${baseUrl}/redirect-post`,
            method: 'POST',
            data: { a: 1 },
        })
        expect(response.data.method).toBe('GET')
        expect(response.data.body).toBe('')
    })

    it('should preserve axios error response for non 2xx status', async () => {
        const ajax = await importAjax(true)
        await expect(ajax({ url: `${baseUrl}/error` })).rejects.toMatchObject({
            response: {
                status: 500,
                data: 'boom',
            },
        })
    })

    it('should reject too many redirects', async () => {
        const ajax = await importAjax(true)
        await expect(ajax({ url: `${baseUrl}/redirect-loop` })).rejects.toThrow(/重定向次数超过上限/)
    })
})
