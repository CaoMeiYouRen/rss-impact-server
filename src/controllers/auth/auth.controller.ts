import { Body, Controller, Get, Logger, Post, Query, Res, Session, UseGuards } from '@nestjs/common'
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
import { getAccessToken, getRandomCode, validateJwt } from '@/utils/helper'
import { HttpError } from '@/models/http-error'
import { DISABLE_PASSWORD_LOGIN, DISABLE_PASSWORD_REGISTER, ENABLE_AUTH0, ENABLE_REGISTER } from '@/app.config'
import { CategoryService } from '@/services/category/category.service'
import { Auth0CallbackData } from '@/models/auth0-callback-data.dto'
import { JwtPayload } from '@/interfaces/auth0'
import { AuthMeta } from '@/models/auth-meta'

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(@InjectRepository(User) private readonly repository: Repository<User>,
        private readonly categoryService: CategoryService,
    ) { }

    private readonly logger: Logger = new Logger(AuthController.name)

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
    async loginByAuth0(@Res() res: Response, @Query('redirect') redirect?: string) {
        if (!res.oidc) {
            throw new HttpError(400, '未初始化 Auth0 相关配置！')
        }
        res.oidc.login({
            returnTo: redirect,
        })
    }

    @ApiOperation({ summary: '基于 Auth0 注册' })
    @Get('register')
    async registerByAuth0(@Res() res: Response, @Query('redirect') redirect?: string) {
        if (!ENABLE_REGISTER) {
            throw new HttpError(400, '当前不允许注册新用户！')
        }
        if (!res.oidc) {
            throw new HttpError(400, '未初始化 Auth0 相关配置！')
        }
        res.oidc.login({
            returnTo: redirect,
            authorizationParams: {
                screen_hint: 'signup',
            },
        })
    }

    @ApiOperation({ summary: '处理 Auth0 回调' })
    @Post('callback')
    async callback(@Body() body: Auth0CallbackData, @Session() session: ISession, @Res() res: Response) {
        // 处理 auth0 回调登录
        try {
            const idToken = body.id_token
            // this.logger.debug(idToken, 'idToken')
            const payload: JwtPayload = await validateJwt(idToken)
            this.logger.debug(payload, 'payload')
            const { sub: auth0Id, email, email_verified, name, picture } = payload
            // 根据 sub 判断登录的第三方账号
            let user: User = null
            // 检查该 sub 是否已经被绑定
            user = await this.repository.findOne({ where: { auth0Id } })
            // 如果该 sub 已经被绑定，则同步用户信息
            if (user) {
                // 同步用户信息
                // user.username = user.username || name
                user.email = email
                user.emailVerified = email_verified
                user.avatar = picture
                user = await this.repository.save(user)

                session.uid = user.id
                session.save()
                res.redirect(302, `/?state=auth0_login_${getRandomCode(16)}`)
                return
            }
            // 如果该 sub 没有被绑定，则检查邮箱是否已注册
            user = await this.repository.findOne({ where: { email } })
            // 如果该邮箱已经被注册，则同步用户信息
            if (user) {
                // 同步用户信息
                user.auth0Id = auth0Id
                // user.email = email
                user.emailVerified = email_verified
                user.avatar = picture
                user = await this.repository.save(user)

                session.uid = user.id
                session.save()
                res.redirect(302, `/?state=auth0_login_${getRandomCode(16)}`)
                return
            }
            if (!ENABLE_REGISTER) {
                throw new HttpError(400, '当前不允许注册新用户！')
            }
            // 如果邮箱未注册，则创建新用户
            user = await this.repository.save(this.repository.create({
                username: name,
                auth0Id,
                email,
                emailVerified: email_verified,
                avatar: picture,
                roles: [Role.user],
                accessToken: getAccessToken('rss-impact'),
                password: getRandomCode(32), // 生成随机密码
                disablePasswordLogin: true, // 不允许密码登录
            }))
            session.uid = user.id
            session.save()
            res.redirect(302, `/?state=auth0_login_${getRandomCode(16)}`)

        } catch (error) {
            this.logger.error(error)
            if (error instanceof HttpError) {
                throw error
            }
            throw new HttpError(400, '无效的 token')
        }
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
                    reject(err)
                    return
                }
                resolve(new ResponseDto({
                    message: 'OK',
                    statusCode: 201,
                }))
                res.oidc.logout({
                    returnTo: '/login',
                })
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
