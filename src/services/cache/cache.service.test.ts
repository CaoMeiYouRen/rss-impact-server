import { CacheService } from './cache.service'

describe('CacheService', () => {
    const createCacheManager = () => ({
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    })

    it('should cache computed values with the rss-impact prefix', async () => {
        const cacheManager = createCacheManager()
        cacheManager.get.mockResolvedValue(undefined)
        cacheManager.set.mockResolvedValue('fresh-value')
        const service = new CacheService(cacheManager as any)
        const loader = jest.fn().mockResolvedValue('fresh-value')

        const value = await service.tryGet('articles:list', loader, 15_000)

        expect(value).toBe('fresh-value')
        expect(loader).toHaveBeenCalledTimes(1)
        expect(cacheManager.get).toHaveBeenCalledWith('rss-impact:articles:list')
        expect(cacheManager.set).toHaveBeenCalledWith('rss-impact:articles:list', 'fresh-value', 15_000)
    })

    it('should return cached values without recomputing', async () => {
        const cacheManager = createCacheManager()
        cacheManager.get.mockResolvedValue('cached-value')
        const service = new CacheService(cacheManager as any)
        const loader = jest.fn()

        const value = await service.tryGet('articles:list', loader)

        expect(value).toBe('cached-value')
        expect(loader).not.toHaveBeenCalled()
        expect(cacheManager.set).not.toHaveBeenCalled()
    })

    it('should refresh ttl when returning cached values with refresh enabled', async () => {
        const cacheManager = createCacheManager()
        cacheManager.get.mockResolvedValue('cached-value')
        cacheManager.set.mockResolvedValue('cached-value')
        const service = new CacheService(cacheManager as any)

        const value = await service.tryGet('articles:list', jest.fn(), 30_000, true)

        expect(value).toBe('cached-value')
        expect(cacheManager.set).toHaveBeenCalledWith('rss-impact:articles:list', 'cached-value', 30_000)
    })

    it('should prefix keys for get, set and del helpers', async () => {
        const cacheManager = createCacheManager()
        cacheManager.get.mockResolvedValue('value')
        cacheManager.set.mockResolvedValue('value')
        cacheManager.del.mockResolvedValue(true)
        const service = new CacheService(cacheManager as any)

        await service.get('feed:error')
        await service.set('feed:error', 2, 1_000)
        await service.del('feed:error')

        expect(cacheManager.get).toHaveBeenCalledWith('rss-impact:feed:error')
        expect(cacheManager.set).toHaveBeenCalledWith('rss-impact:feed:error', 2, 1_000)
        expect(cacheManager.del).toHaveBeenCalledWith('rss-impact:feed:error')
    })
})
