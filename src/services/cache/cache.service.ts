import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cache, Milliseconds } from 'cache-manager'
import { __DEV__, CACHE_EXPIRE } from '@/app.config'

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
            __DEV__ && this.logger.debug(`key: "${key}" 命中缓存`)
            if (refresh) {
                __DEV__ && this.logger.debug(`key: "${key}" 已刷新有效期`)
                await this.cacheManager.set(cacheKey, cacheData, ttl)
            }
            return cacheData
        }
        cacheData = await cb()
        await this.cacheManager.set(cacheKey, cacheData, ttl)
        return cacheData
    }

    async get<T = unknown>(key: string) {
        const cacheKey = `cmyr-llm-server:${key}`
        return this.cacheManager.get<T>(cacheKey)
    }

    async set<T = unknown>(key: string, value: T, ttl: Milliseconds = 300 * 1000) {
        const cacheKey = `cmyr-llm-server:${key}`
        return this.cacheManager.set(cacheKey, value, ttl)
    }

}
