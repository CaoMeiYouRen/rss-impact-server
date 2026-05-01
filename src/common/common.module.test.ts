import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Test } from '@nestjs/testing'

const mockRedisStoreFactory = jest.fn()

jest.mock('@/app.config', () => ({
    CACHE_EXPIRE: 300,
    ENABLE_DOWNLOAD_HTTP: false,
    REDIS_URL: 'redis://cache.test:6379/0',
    RESOURCE_DOWNLOAD_PATH: 'D:/tmp/download',
}))

jest.mock('@keyv/redis', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
        const storage = new Map<string, unknown>()
        const store = {
            get: jest.fn(async (key: string) => storage.get(key)),
            set: jest.fn(async (key: string, value: unknown) => {
                storage.set(key, value)
                return true
            }),
            delete: jest.fn(async (key: string) => storage.delete(key)),
            clear: jest.fn(async () => {
                storage.clear()
            }),
            disconnect: jest.fn(async () => { }),
        }
        mockRedisStoreFactory.mockReturnValue(store)
        return store
    }),
}))

jest.mock('@sentry/nestjs/setup', () => ({
    SentryModule: {
        forRoot: () => ({
            module: class MockSentryModule { },
        }),
    },
}))

import KeyvRedis from '@keyv/redis'
import { CommonModule } from './common.module'

describe('CommonModule cache configuration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should wire the Redis adapter into the Nest cache manager when REDIS_URL is configured', async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [CommonModule],
        }).compile()

        const cache = moduleRef.get(CACHE_MANAGER)
        const redisStore = (KeyvRedis as unknown as jest.Mock).mock.results[0]?.value

        await cache.set('rss-impact:test-key', 'cached-value', 60_000)
        const value = await cache.get('rss-impact:test-key')

        expect(KeyvRedis).toHaveBeenCalledWith('redis://cache.test:6379/0')
        expect(redisStore.set).toHaveBeenCalled()
        expect(redisStore.get).toHaveBeenCalled()
        expect(value).toBe('cached-value')

        await moduleRef.close()
    })
})
