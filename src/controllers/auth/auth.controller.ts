import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { LoginDto } from '@/models/login.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    @Post('login')
    @UseGuards(AuthGuard('local'))
    @ApiOperation({ summary: '登录' })
    async login(@Body() _dto: LoginDto, @CurrentUser() user: User) {
        // const { token } = this.authService.getAuthToken(user)
        return user
    }
}
