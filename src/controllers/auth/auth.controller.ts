import { Body, Controller, Get, Post, Res, Session, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Response } from 'express'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { LoginDto } from '@/models/login.dto'
import { ResponseDto } from '@/models/response.dto'
import { ISession } from '@/interfaces/session'
import { RegisterDto } from '@/models/register.dto'
import { Role } from '@/constant/role'
import { getAccessToken } from '@/utils/helper'
import { HttpError } from '@/models/http-error'
import { BASE_URL, DISABLE_PASSWORD_LOGIN, DISABLE_PASSWORD_REGISTER, ENABLE_AUTH0, ENABLE_REGISTER } from '@/app.config'
import { CategoryService } from '@/services/category/category.service'
import { AuthMeta } from '@/models/auth-meta'

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(@InjectRepository(User) private readonly repository: Repository<User>,
        private readonly categoryService: CategoryService,
    ) { }

    @ApiResponse({ status: 200, type: AuthMeta })
    @ApiOperation({ summary: '登录注册相关的元信息' })
    @Get('meta')
    async meta() {
        return {
            enableRegister: ENABLE_REGISTER,
            disablePasswordLogin: DISABLE_PASSWORD_LOGIN,
            disablePasswordRegister: !ENABLE_REGISTER || DISABLE_PASSWORD_REGISTER,
            enableAuth0: ENABLE_AUTH0,
        }
    }

    @ApiResponse({ status: 201, type: ResponseDto })
    @ApiOperation({ summary: '登录' })
    @Post('login')
    @UseGuards(AuthGuard('local'))
    async login(@Body() _dto: LoginDto, @CurrentUser() user: User, @Session() session: ISession) {
        if (session) {
            session.uid = user.id
        }
        return new ResponseDto({
            message: 'OK',
            statusCode: 201,
        })
    }

    @ApiOperation({ summary: '基于 Auth0 登录' })
    @Get('login')
    async loginByAuth0(@Res() res: Response) {
        if (!res.oidc) {
            throw new HttpError(400, '未初始化 Auth0 相关配置！')
        }
        res.oidc.login({
            returnTo: BASE_URL,
        })
    }

    @ApiOperation({ summary: '基于 Auth0 注册' })
    @Get('register')
    async registerByAuth0(@Res() res: Response) {
        if (!ENABLE_REGISTER) {
            throw new HttpError(400, '当前不允许注册新用户！')
        }
        if (!res.oidc) {
            throw new HttpError(400, '未初始化 Auth0 相关配置！')
        }
        res.oidc.login({
            returnTo: BASE_URL,
            authorizationParams: {
                screen_hint: 'signup',
            },
        })
    }

    @ApiResponse({ status: 201, type: ResponseDto })
    @ApiOperation({ summary: '登出' })
    @Post('logout')
    async logout(@Session() session: ISession, @Res() res: Response) {
        return new Promise((resolve, reject) => {
            if (!session) {
                return resolve(new ResponseDto({
                    message: 'OK',
                    statusCode: 201,
                }))
            }
            session.destroy((err) => {
                if (err) {
                    reject(err as Error)
                    return
                }
                resolve(new ResponseDto({
                    message: 'OK',
                    statusCode: 201,
                }))
                if (res.oidc) {
                    res.oidc.logout({
                        returnTo: '/login',
                    })
                }
            })
        })
    }

    @ApiResponse({ status: 201, type: User })
    @ApiOperation({ summary: '注册' })
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        if (!ENABLE_REGISTER) {
            throw new HttpError(400, '当前不允许注册新用户！')
        }
        if (DISABLE_PASSWORD_REGISTER) {
            throw new HttpError(400, '当前不允许通过账号密码注册！')
        }
        const { username, password, email } = dto
        if (await this.repository.findOne({ where: [{ username }, { email }] })) {
            throw new HttpError(400, '已存在相同用户名或邮箱')
        }
        const user = await this.repository.save(this.repository.create({
            username,
            password,
            email,
            roles: [Role.user],
            accessToken: getAccessToken('rss-impact'),
        }))
        delete user.password
        // 创建默认的未分类项
        await this.categoryService.findOrCreateUncategorizedCategory(user)
        return user
    }

}
