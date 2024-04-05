import { Body, Controller, Logger, Post, Session, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { LoginDto } from '@/models/login.dto'
import { ResponseDto } from '@/models/response.dto'

// TODO 考虑增加注册逻辑
@ApiTags('auth')
@Controller('auth')
export class AuthController {

    private readonly logger: Logger = new Logger(AuthController.name)

    @ApiResponse({ status: 201, type: ResponseDto })
    @ApiOperation({ summary: '登录' })
    @Post('login')
    @UseGuards(AuthGuard('local'))
    async login(@Body() _dto: LoginDto, @CurrentUser() user: User, @Session() session: Record<string, any>) {
        // TODO 考虑增加 session 管理
        session.uid = user.id
        return new ResponseDto({
            message: 'OK',
        })
    }
}
