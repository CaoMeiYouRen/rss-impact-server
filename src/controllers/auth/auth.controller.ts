import { Body, Controller, Logger, Post, Session, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { LoginDto } from '@/models/login.dto'
import { ResponseDto } from '@/models/response.dto'
import { ISession } from '@/interfaces/session'
import { RegisterDto } from '@/models/register.dto'
import { Role } from '@/constant/role'
import { getAccessToken } from '@/utils/helper'
import { HttpError } from '@/models/http-error'

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(@InjectRepository(User) private readonly repository: Repository<User>,
    ) { }

    private readonly logger: Logger = new Logger(AuthController.name)

    @ApiResponse({ status: 201, type: ResponseDto })
    @ApiOperation({ summary: '登录' })
    @Post('login')
    @UseGuards(AuthGuard('local'))
    async login(@Body() _dto: LoginDto, @CurrentUser() user: User, @Session() session: ISession) {
        // TODO 考虑增加 session 管理
        session.uid = user.id
        return new ResponseDto({
            message: 'OK',
            statusCode: 201,
        })
    }

    @ApiResponse({ status: 201, type: ResponseDto })
    @ApiOperation({ summary: '登出' })
    @Post('logout')
    async logout(@CurrentUser() user: User, @Session() session: ISession) {
        return new Promise((resolve, reject) => {
            session?.destroy((err) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(new ResponseDto({
                    message: 'OK',
                    statusCode: 201,
                }))
            })
        })
    }

    @ApiResponse({ status: 201, type: User })
    @ApiOperation({ summary: '注册' })
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        const { username, password, email } = dto
        if (await this.repository.findOne({ where: [{ username }, { email }] })) {
            throw new HttpError(400, '已存在相同用户名或邮箱')
        }
        const user = await this.repository.save(this.repository.create({
            username,
            password,
            email,
            roles: [Role.user],
            accessToken: getAccessToken(),
        }))
        delete user.password
        return user
    }

}
