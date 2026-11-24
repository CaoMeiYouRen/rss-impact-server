import { createProxyFetch } from './proxy-fetch'

describe('createProxyFetch', () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should block internal urls before calling fetch', async () => {
        const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
        const proxyFetch = createProxyFetch()
        await expect(proxyFetch('http://127.0.0.1:3000/')).rejects.toMatchObject({ name: 'SsrfBlockedError' })
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('should delegate to native fetch for public urls', async () => {
        const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
        const proxyFetch = createProxyFetch()
        const response = await proxyFetch('http://8.8.8.8/')
        expect(await response.text()).toBe('ok')
        expect(fetchMock).toHaveBeenCalledWith('http://8.8.8.8/', undefined)
    })
})
