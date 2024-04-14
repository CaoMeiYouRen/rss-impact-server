import path from 'path'
import { Module, Global } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
// import { WinstonModule } from 'nest-winston'
// import * as winston from 'winston'
// import { RESOURCE_DOWNLOAD_PATH } from '@/app.config'

@Global()
@Module({
    imports: [
        PassportModule,
        ScheduleModule.forRoot(),
        ServeStaticModule.forRoot(
            // {
            //     rootPath: path.resolve(RESOURCE_DOWNLOAD_PATH),
            //     serveRoot: '/download',
            // },
            {
                rootPath: path.join(__dirname, '../../public/'),
                serveRoot: '/',
            },
        ),
        // WinstonModule.forRoot({
        //     // options
        // }),
    ],
    exports: [
        PassportModule,
        ScheduleModule,
        ServeStaticModule,
    ],
})
export class CommonModule { }

