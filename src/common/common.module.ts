import { Module, Global } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'

@Global()
@Module({
    imports: [PassportModule],
    exports: [PassportModule],
})
export class CommonModule { }
