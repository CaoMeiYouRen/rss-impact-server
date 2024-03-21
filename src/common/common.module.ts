import { Module, Global } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { ScheduleModule } from '@nestjs/schedule'

@Global()
@Module({
    imports: [PassportModule, ScheduleModule.forRoot()],
    exports: [PassportModule, ScheduleModule],
})
export class CommonModule { }
