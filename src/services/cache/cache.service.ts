import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cache, Milliseconds } from 'cache-manager'
import { CACHE_EXPIRE } from '@/app.config'

@Injectable()
export class CacheService {

    private readonly logger = new Logger(CacheService.name)

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
    }

    async tryGet<T = unknown>(key: string, cb: () => T | Promise<T>, ttl: Milliseconds = CACHE_EXPIRE * 1000, refresh = true) {
        const cacheKey = `rss-impact:${key}`
        let cacheData = await this.cacheManager.get<T>(cacheKey)
        if (cacheData) {
            return cacheData
        }
        cacheData = await cb()
        await this.cacheManager.set(cacheKey, cacheData, ttl)
        return cacheData
    }

}
