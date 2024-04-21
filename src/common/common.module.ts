import path from 'path'
import { Module, Global } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { ENABLE_DOWNLOAD_HTTP, RESOURCE_DOWNLOAD_PATH } from '@/app.config'
// import { WinstonModule } from 'nest-winston'
// import * as winston from 'winston'
// import { RESOURCE_DOWNLOAD_PATH } from '@/app.config'

@Global()
@Module({
    imports: [
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
    ],
    exports: [
        PassportModule,
        ScheduleModule,
        ServeStaticModule,
    ],
})
export class CommonModule { }

