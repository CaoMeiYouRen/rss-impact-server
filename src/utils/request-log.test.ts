import { buildRequestErrorLog, truncateLogValue } from './request-log'

describe('truncateLogValue', () => {
    it('should keep small values unchanged', () => {
        expect(truncateLogValue('ok')).toBe('ok')
        expect(truncateLogValue({ a: 1 })).toEqual({ a: 1 })
        expect(truncateLogValue(null)).toBeNull()
        expect(truncateLogValue(undefined)).toBeUndefined()
    })

    it('should truncate long strings', () => {
        const result = truncateLogValue('a'.repeat(100), 10) as string
        expect(result.startsWith('aaaaaaaaaa')).toBe(true)
        expect(result).toContain('已截断')
    })

    it('should truncate long objects', () => {
        const result = truncateLogValue({ text: 'a'.repeat(100) }, 20) as { truncated: boolean, preview: string }
        expect(result.truncated).toBe(true)
        expect(result.preview.length).toBe(20)
    })

    it('should handle circular objects', () => {
        const obj: Record<string, unknown> = {}
        obj.self = obj
        expect(typeof truncateLogValue(obj)).toBe('string')
    })
})

describe('buildRequestErrorLog', () => {
    it('should only keep message, code, status code and response data', () => {
        const error = {
            message: 'Request failed',
            code: 'ERR_BAD_RESPONSE',
            config: {
                headers: { Authorization: 'Bearer secret' },
            },
            response: {
                status: 500,
                data: 'boom',
                headers: { 'set-cookie': 'secret' },
            },
        }
        const result = buildRequestErrorLog(error)
        expect(result).toEqual({
            message: 'Request failed',
            code: 'ERR_BAD_RESPONSE',
            statusCode: 500,
            response: 'boom',
        })
        expect(JSON.stringify(result)).not.toContain('secret')
    })

    it('should work without a response', () => {
        const result = buildRequestErrorLog(new Error('network error'))
        expect(result.message).toBe('network error')
        expect(result.statusCode).toBeUndefined()
        expect(result.response).toBeUndefined()
    })
})
