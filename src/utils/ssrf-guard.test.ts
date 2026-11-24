import dns from 'dns'
import { assertSafeUrl, assertSafeUrlsInValue, createSafeLookup, isBlockedAddress, isSafeHttpUrl, normalizeHostname, SafeLookupFunction, SsrfBlockedError } from './ssrf-guard'

const strictOptions = {
    allowPrivateNetwork: false,
    allowedCidrs: [],
    blockedCidrs: [],
}

const allowPrivateOptions = {
    allowPrivateNetwork: true,
    allowedCidrs: [],
    blockedCidrs: [],
}

function invokeLookup(lookup: SafeLookupFunction, hostname: string, options: dns.LookupOptions = {}) {
    return new Promise<{ error: NodeJS.ErrnoException | null, address?: string | dns.LookupAddress[], family?: number }>((resolve) => {
        lookup(hostname, options, (error, address, family) => resolve({ error, address, family }))
    })
}

describe('normalizeHostname', () => {
    it('should strip brackets and trailing dots', () => {
        expect(normalizeHostname('[::1]')).toBe('::1')
        expect(normalizeHostname('Example.COM.')).toBe('example.com')
        expect(normalizeHostname(' 127.0.0.1. ')).toBe('127.0.0.1')
    })
})

describe('isBlockedAddress', () => {
    it.each([
        '127.0.0.1',
        '10.1.2.3',
        '172.16.0.1',
        '172.31.255.255',
        '192.168.1.1',
        '100.64.0.1',
        '169.254.169.254',
        '0.0.0.0',
        '::1',
        'fc00::1',
        'fe80::1',
        '::ffff:127.0.0.1',
        '::ffff:7f00:1',
        '::7f00:1',
        'fd00:ec2::254',
        '100.100.100.200',
    ])('should block internal address %s', (address) => {
        expect(isBlockedAddress(address, strictOptions)).toBe(true)
    })

    it.each([
        '8.8.8.8',
        '1.1.1.1',
        '2606:4700:4700::1111',
    ])('should allow public address %s', (address) => {
        expect(isBlockedAddress(address, strictOptions)).toBe(false)
    })

    it('should allow private addresses when explicitly enabled', () => {
        expect(isBlockedAddress('10.1.2.3', allowPrivateOptions)).toBe(false)
        expect(isBlockedAddress('127.0.0.1', allowPrivateOptions)).toBe(false)
        expect(isBlockedAddress('::1', allowPrivateOptions)).toBe(false)
        expect(isBlockedAddress('fc00::1', allowPrivateOptions)).toBe(false)
    })

    it('should always block metadata and link-local addresses even when private network is allowed', () => {
        expect(isBlockedAddress('169.254.169.254', allowPrivateOptions)).toBe(true)
        expect(isBlockedAddress('100.100.100.200', allowPrivateOptions)).toBe(true)
        expect(isBlockedAddress('fd00:ec2::254', allowPrivateOptions)).toBe(true)
        expect(isBlockedAddress('fe80::1', allowPrivateOptions)).toBe(true)
    })

    it('should let the explicit allowlist override the default rules', () => {
        const options = {
            ...strictOptions,
            allowedCidrs: ['169.254.169.254/32', '10.0.0.0/8'],
        }
        expect(isBlockedAddress('169.254.169.254', options)).toBe(false)
        expect(isBlockedAddress('10.1.2.3', options)).toBe(false)
        expect(isBlockedAddress('10.1.2.3', strictOptions)).toBe(true)
    })

    it('should support an explicit denylist', () => {
        const options = {
            ...strictOptions,
            blockedCidrs: ['8.8.8.8/32'],
        }
        expect(isBlockedAddress('8.8.8.8', options)).toBe(true)
        expect(isBlockedAddress('8.8.8.8', strictOptions)).toBe(false)
    })

    it('should fail closed for invalid addresses', () => {
        expect(isBlockedAddress('not-an-ip', strictOptions)).toBe(true)
        expect(isBlockedAddress('', strictOptions)).toBe(true)
    })
})

describe('assertSafeUrl', () => {
    it('should allow public http/https urls without resolving', async () => {
        await expect(assertSafeUrl('https://example.com/path', strictOptions)).resolves.toBeInstanceOf(URL)
        await expect(assertSafeUrl('http://example.com', strictOptions)).resolves.toBeInstanceOf(URL)
    })

    it.each([
        'ftp://example.com/file',
        'file:///etc/passwd',
        'gopher://example.com/',
        'not-a-url',
        'http://',
    ])('should reject unsupported url %s', async (url) => {
        await expect(assertSafeUrl(url, strictOptions)).rejects.toBeInstanceOf(SsrfBlockedError)
    })

    it('should reject urls containing credentials', async () => {
        await expect(assertSafeUrl('http://user:pass@example.com/', strictOptions)).rejects.toBeInstanceOf(SsrfBlockedError)
    })

    it.each([
        'http://127.0.0.1:3000/',
        'http://169.254.169.254/latest/meta-data/',
        'http://10.0.0.1/',
        'http://[::1]:3000/',
        'http://[::ffff:127.0.0.1]/',
        // WHATWG URL 会把十进制、八进制 IP 归一化为 127.0.0.1
        'http://2130706433/',
        'http://0177.0.0.1/',
    ])('should reject internal url %s', async (url) => {
        await expect(assertSafeUrl(url, strictOptions)).rejects.toBeInstanceOf(SsrfBlockedError)
    })

    it('should allow private url literals when explicitly enabled', async () => {
        await expect(assertSafeUrl('http://127.0.0.1:3000/', allowPrivateOptions)).resolves.toBeInstanceOf(URL)
    })

    it('should still reject metadata url when private network is allowed', async () => {
        await expect(assertSafeUrl('http://169.254.169.254/', allowPrivateOptions)).rejects.toBeInstanceOf(SsrfBlockedError)
    })

    it('should reject a hostname resolving to a private address when resolve is enabled', async () => {
        await expect(assertSafeUrl('http://localhost:3000/', { ...strictOptions, resolve: true })).rejects.toBeInstanceOf(SsrfBlockedError)
    })

    it('should allow a hostname resolving to a private address when private network is enabled', async () => {
        await expect(assertSafeUrl('http://localhost:3000/', { ...allowPrivateOptions, resolve: true })).resolves.toBeInstanceOf(URL)
    })
})

describe('isSafeHttpUrl', () => {
    it('should accept public urls', () => {
        expect(isSafeHttpUrl('https://example.com/feed.xml', strictOptions)).toBe(true)
    })

    it('should reject internal ip literals and single label hostnames by default', () => {
        expect(isSafeHttpUrl('http://127.0.0.1:3000', strictOptions)).toBe(false)
        expect(isSafeHttpUrl('http://169.254.169.254/', strictOptions)).toBe(false)
        expect(isSafeHttpUrl('http://localhost:3000', strictOptions)).toBe(false)
        expect(isSafeHttpUrl('http://hass:8123', strictOptions)).toBe(false)
    })

    it('should allow private addresses when explicitly enabled', () => {
        expect(isSafeHttpUrl('http://127.0.0.1:3000', allowPrivateOptions)).toBe(true)
        expect(isSafeHttpUrl('http://hass:8123', allowPrivateOptions)).toBe(true)
    })

    it('should keep rejecting metadata addresses when private network is enabled', () => {
        expect(isSafeHttpUrl('http://169.254.169.254/', allowPrivateOptions)).toBe(false)
    })

    it('should reject invalid urls and protocols', () => {
        expect(isSafeHttpUrl('ftp://example.com/file', strictOptions)).toBe(false)
        expect(isSafeHttpUrl('http://user:pass@example.com/', strictOptions)).toBe(false)
        expect(isSafeHttpUrl('not-a-url', strictOptions)).toBe(false)
    })
})

describe('assertSafeUrlsInValue', () => {
    it('should reject nested internal urls', async () => {
        await expect(assertSafeUrlsInValue({
            url: 'https://example.com/',
            nested: {
                list: ['https://example.com/a', 'http://127.0.0.1:3000/'],
            },
        }, strictOptions)).rejects.toBeInstanceOf(SsrfBlockedError)
    })

    it('should allow public urls and ignore non-url strings', async () => {
        await expect(assertSafeUrlsInValue({
            url: 'https://example.com/',
            text: 'not a url',
            number: 1,
        }, strictOptions)).resolves.toBeUndefined()
    })

    it('should skip proxy keys', async () => {
        await expect(assertSafeUrlsInValue({
            PROXY_URL: 'http://127.0.0.1:7890/',
            url: 'https://example.com/',
        }, { ...strictOptions, skipKeys: ['proxy'] })).resolves.toBeUndefined()
    })
})

describe('createSafeLookup', () => {
    it('should reject a hostname resolving to loopback', async () => {
        const { error } = await invokeLookup(createSafeLookup(strictOptions), 'localhost')
        expect(error).toBeInstanceOf(SsrfBlockedError)
    })

    it('should return all addresses when requested', async () => {
        const { error, address } = await invokeLookup(createSafeLookup(allowPrivateOptions), 'localhost', { all: true })
        expect(error).toBeNull()
        expect(Array.isArray(address)).toBe(true)
        expect((address as dns.LookupAddress[]).length).toBeGreaterThan(0)
    })

    it('should allow loopback when private network is enabled', async () => {
        const { error, address } = await invokeLookup(createSafeLookup(allowPrivateOptions), 'localhost')
        expect(error).toBeNull()
        expect(typeof address).toBe('string')
    })

    it('should reject when DNS returns a mix of public and private addresses (rebinding)', async () => {
        jest.spyOn(dns, 'lookup').mockImplementation(((_hostname: string, _options: dns.LookupOptions, callback: (error: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => void) => {
            callback(null, [
                { address: '93.184.216.34', family: 4 },
                { address: '127.0.0.1', family: 4 },
            ])
        }) as any)
        const { error } = await invokeLookup(createSafeLookup(strictOptions), 'example.com')
        expect(error).toBeInstanceOf(SsrfBlockedError)
        jest.restoreAllMocks()
    })
})
