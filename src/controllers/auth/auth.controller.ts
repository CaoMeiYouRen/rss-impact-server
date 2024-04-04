import { Body, Controller, Logger, Post, Session, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { LoginDto } from '@/models/login.dto'
import { ResponseDto } from '@/models/response.dto'

// TODO 考虑增加注册逻辑
@ApiTags('auth')
@Controller('auth')
export class AuthController {

    private readonly logger: Logger = new Logger(AuthController.name)

    @Post('login')
    @UseGuards(AuthGuard('local'))
    @ApiOperation({ summary: '登录' })
    async login(@Body() _dto: LoginDto, @CurrentUser() user: User, @Session() session: Record<string, any>) {
        session.uid = user.id
        return new ResponseDto({
            message: 'OK',
        })
    }
}
