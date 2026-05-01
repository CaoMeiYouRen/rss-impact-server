import path from 'path'
import { Module, Global } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import KeyvRedis from '@keyv/redis'
import { PassportModule } from '@nestjs/passport'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { SentryModule } from '@sentry/nestjs/setup'
import { CACHE_EXPIRE, ENABLE_DOWNLOAD_HTTP, REDIS_URL, RESOURCE_DOWNLOAD_PATH } from '@/app.config'

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
                // 启用 Redis 缓存
                if (REDIS_URL) {
                    const store = new KeyvRedis(REDIS_URL)
                    return {
                        stores: store,
                        ttl: CACHE_EXPIRE * 1000,
                    }
                }
                // 默认使用内存缓存
                return {
                    ttl: CACHE_EXPIRE * 1000,
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

