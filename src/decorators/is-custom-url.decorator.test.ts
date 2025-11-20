import { validate } from 'class-validator'

describe('IsCustomURL', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    it('should allow localhost when not in production', async () => {
        jest.doMock('@/app.config', () => ({
            __PROD__: false,
        }))

        const { IsCustomURL } = await import('./is-custom-url.decorator')

        class TestClass {

            @IsCustomURL()
            url: string

            constructor(url: string) {
                this.url = url
            }

        }

        const model = new TestClass('http://localhost:3000')
        const errors = await validate(model)
        expect(errors.length).toBe(0)
    })

    it('should require TLD when in production', async () => {
        jest.doMock('@/app.config', () => ({
            __PROD__: true,
        }))

        const { IsCustomURL } = await import('./is-custom-url.decorator')

        class TestClass {

            @IsCustomURL()
            url: string

            constructor(url: string) {
                this.url = url
            }

        }

        // localhost has no TLD
        const model = new TestClass('http://localhost:3000')
        const errors = await validate(model)
        expect(errors.length).toBeGreaterThan(0)
    })

    it('should allow valid domain with TLD in production', async () => {
        jest.doMock('@/app.config', () => ({
            __PROD__: true,
        }))

        const { IsCustomURL } = await import('./is-custom-url.decorator')

        class TestClass {

            @IsCustomURL()
            url: string

            constructor(url: string) {
                this.url = url
            }

        }

        const model = new TestClass('https://google.com')
        const errors = await validate(model)
        expect(errors.length).toBe(0)
    })


    it('should validate invalid URL', async () => {
        jest.doMock('@/app.config', () => ({
            __PROD__: false,
        }))

        const { IsCustomURL } = await import('./is-custom-url.decorator')

        class TestClass {

            @IsCustomURL()
            url: string

            constructor(url: string) {
                this.url = url
            }

        }

        const model = new TestClass('http://invalid url')
        const errors = await validate(model)
        expect(errors.length).toBeGreaterThan(0)
    })
})
