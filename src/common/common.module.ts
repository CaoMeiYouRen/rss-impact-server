import path from 'path'
import { Module, Global } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'

@Global()
@Module({
    imports: [
        PassportModule,
        ScheduleModule.forRoot(),
        ServeStaticModule.forRoot({
            rootPath: path.join(__dirname, '../../public/'),
        })],
    exports: [
        PassportModule,
        ScheduleModule,
    ],
})
export class CommonModule { }
