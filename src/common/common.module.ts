import path from 'path'
import { Module, Global } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { PassportModule } from '@nestjs/passport'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { redisInsStore } from 'cache-manager-ioredis-yet'
import { SentryModule } from '@sentry/nestjs/setup'
import { CACHE_EXPIRE, ENABLE_DOWNLOAD_HTTP, REDIS_URL, RESOURCE_DOWNLOAD_PATH } from '@/app.config'
import { getRedisClient } from '@/utils/redis'

@Global()
@Module({
    imports: [
        SentryModule.forRoot(),
        PassportModule,
        ScheduleModule.forRoot(),
        ServeStaticModule.forRootAsync({
            async useFactory() {
                return [
                    ENABLE_DOWNLOAD_HTTP && {
                        rootPath: RESOURCE_DOWNLOAD_PATH,
                        serveRoot: '/download',
                    },
                    {
                        rootPath: path.resolve('./public'),
                        serveRoot: '/',
                    },
                ].filter(Boolean)
            },
        }),
        CacheModule.registerAsync({
            async useFactory() {
                if (REDIS_URL) {
                    const client = getRedisClient()
                    const store = redisInsStore(client, { ttl: CACHE_EXPIRE * 1000 })
                    return {
                        store,
                    }
                }
                return {
                }
            },
        }),
    ].filter(Boolean),
    exports: [
        PassportModule,
        ScheduleModule,
        ServeStaticModule,
        CacheModule,
    ],
})
export class CommonModule { }

