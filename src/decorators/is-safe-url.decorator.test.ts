import { validate } from 'class-validator'

describe('IsSafeUrl', () => {
    async function validateUrl(url: string) {
        const { IsSafeUrl } = await import('./is-safe-url.decorator')

        class TestClass {

            @IsSafeUrl()
            url: string

            constructor(value: string) {
                this.url = value
            }

        }

        return validate(new TestClass(url))
    }

    beforeEach(() => {
        jest.resetModules()
        jest.dontMock('@/app.config')
    })

    it('should allow public http/https urls', async () => {
        expect(await validateUrl('https://example.com/feed.xml')).toHaveLength(0)
        expect(await validateUrl('http://example.com/rss')).toHaveLength(0)
    })

    it('should reject non-http protocols', async () => {
        expect(await validateUrl('ftp://example.com/file')).not.toHaveLength(0)
        expect(await validateUrl('file:///etc/passwd')).not.toHaveLength(0)
    })

    it('should reject urls containing credentials', async () => {
        expect(await validateUrl('http://user:pass@example.com/')).not.toHaveLength(0)
    })

    it('should require an absolute url', async () => {
        expect(await validateUrl('example.com/feed.xml')).not.toHaveLength(0)
    })

    it('should reject internal and loopback addresses by default', async () => {
        expect(await validateUrl('http://127.0.0.1:3000/')).not.toHaveLength(0)
        expect(await validateUrl('http://169.254.169.254/latest/meta-data/')).not.toHaveLength(0)
        expect(await validateUrl('http://192.168.1.10/')).not.toHaveLength(0)
        expect(await validateUrl('http://localhost:3000/')).not.toHaveLength(0)
    })

    it('should allow private addresses when explicitly enabled', async () => {
        jest.resetModules()
        jest.doMock('@/app.config', () => ({
            SSRF_GUARD_ENABLED: true,
            SSRF_ALLOW_PRIVATE_NETWORK: true,
            SSRF_ALLOWED_CIDRS: [],
            SSRF_BLOCKED_CIDRS: [],
        }))
        const { IsSafeUrl } = await import('./is-safe-url.decorator')

        class TestClass {

            @IsSafeUrl()
            url: string

            constructor(value: string) {
                this.url = value
            }

        }

        expect(await validate(new TestClass('http://192.168.1.10:8123/'))).toHaveLength(0)
        expect(await validate(new TestClass('http://169.254.169.254/'))).not.toHaveLength(0)
    })

    it('should support a custom validation message', async () => {
        jest.resetModules()
        const { IsSafeUrl } = await import('./is-safe-url.decorator')

        class TestClass {

            @IsSafeUrl({}, { message: '封面Url必须为标准URL格式' })
            url: string

            constructor(value: string) {
                this.url = value
            }

        }

        const errors = await validate(new TestClass('http://127.0.0.1/'))
        expect(errors[0].constraints).toEqual({ isSafeUrl: '封面Url必须为标准URL格式' })
    })
})
