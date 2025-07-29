import { Body, Controller, Get, Logger, Post, Query, Req, Res, Session, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Response, Request } from 'express'
import * as cookieParser from 'cookie-parser'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { LoginDto } from '@/models/login.dto'
import { ResponseDto } from '@/models/response.dto'
import { ISession } from '@/interfaces/session'
import { RegisterDto } from '@/models/register.dto'
import { Role } from '@/constant/role'
import { getAccessToken, getRandomCode, validateJwt } from '@/utils/helper'
import { HttpError } from '@/models/http-error'
import { AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, BASE_URL, DISABLE_PASSWORD_LOGIN, DISABLE_PASSWORD_REGISTER, ENABLE_AUTH0, ENABLE_REGISTER, OIDC_REDIRECT_URL, SESSION_SECRET } from '@/app.config'
import { CategoryService } from '@/services/category/category.service'
import { Auth0CallbackData } from '@/models/auth0-callback-data.dto'
import { JwtPayload } from '@/interfaces/auth0'
import { AuthMeta } from '@/models/auth-meta'
import { OIDCService } from '@/services/oidc/oidc.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(@InjectRepository(User) private readonly repository: Repository<User>,
        private readonly categoryService: CategoryService,
        private readonly oidcService: OIDCService,
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
            returnTo: BASE_URL,
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
            returnTo: BASE_URL,
            authorizationParams: {
                screen_hint: 'signup',
            },
        })
    }

    @ApiOperation({ summary: '处理 OIDC 回调' })
    @Post('callback')
    async callback(@Body() body: Auth0CallbackData, @Session() session: ISession, @Res() res: Response) {
        // 处理 OIDC 回调登录
        // console.log('OIDC Callback Data:', body)
        try {
            // 兼容两种模式：id_token 直接回调和 authorization_code 流程
            let payload: JwtPayload

            if (body.id_token) {
                // Auth0 模式：直接处理 id_token
                payload = await validateJwt(body.id_token)
            } else if (res.oidc && 'user' in res.oidc && res.oidc.user) {
                // 标准 OIDC 模式：从中间件获取用户信息
                payload = res.oidc.user as JwtPayload
            } else {
                throw new Error('未找到有效的用户信息')
            }

            return await this.processOIDCUser(payload, session, res)
        } catch (error) {
            this.logger.error(error)
            if (error instanceof HttpError) {
                throw error
            }
            throw new HttpError(400, `认证失败: ${error.message}`)
        }
    }

    @ApiOperation({ summary: '处理 OIDC GET 回调' })
    @Get('callback')
    async callbackGet(@Query() query: Auth0CallbackData, @Session() session: ISession, @Res() res: Response, @Req() req: Request) {
        // 处理标准 OIDC 的 GET 回调
        try {
            if (res.oidc && 'user' in res.oidc && res.oidc.user) {
                const payload = res.oidc.user as JwtPayload
                return await this.processOIDCUser(payload, session, res)
            }

            const { code, state } = query
            if (code && state) {
                // 获取PKCE code_verifier
                let codeVerifier: string | undefined
                try {
                    console.log('req.cookies:', req.cookies)
                    console.log('req.signedCookies:', req.signedCookies)

                    let authVerificationCookie = req.signedCookies?.auth_verification

                    // 如果没有在signedCookies中找到，尝试从普通cookies获取并手动验证签名
                    if (!authVerificationCookie) {
                        const rawCookie = req.cookies?.auth_verification
                        if (rawCookie && typeof rawCookie === 'string') {
                            // 检查是否是自定义签名格式: "data.signature"
                            // 找到最后一个点，分割数据和签名
                            const lastDotIndex = rawCookie.lastIndexOf('.')
                            if (lastDotIndex > 0 && lastDotIndex < rawCookie.length - 1) {
                                const data = rawCookie.substring(0, lastDotIndex)
                                const sig = rawCookie.substring(lastDotIndex + 1)
                                try {
                                    // 构造成标准的签名cookie格式 "s:data.signature"
                                    const standardSignedCookie = `s:${data}.${sig}`
                                    const verifiedData = cookieParser.signedCookie(standardSignedCookie, SESSION_SECRET)

                                    if (verifiedData !== false && verifiedData !== undefined) {
                                        authVerificationCookie = verifiedData
                                        this.logger.debug('Successfully verified custom signed cookie format')
                                    } else {
                                        this.logger.warn('Cookie signature verification failed')
                                        // 如果签名验证失败，尝试直接解析数据部分（不推荐，但作为备用）
                                        authVerificationCookie = data
                                        this.logger.warn('Using unverified cookie data as fallback')
                                    }
                                } catch (verifyError) {
                                    this.logger.warn('Failed to verify cookie signature:', verifyError)
                                    // 作为最后的备用方案，直接使用数据部分
                                    authVerificationCookie = data
                                }
                            } else {
                                // 如果不是预期的格式，直接使用原始cookie
                                authVerificationCookie = rawCookie
                            }
                        }
                    }

                    if (authVerificationCookie) {
                        // 如果是字符串，需要解析JSON；如果已经是对象，直接使用
                        const verificationData = typeof authVerificationCookie === 'string'
                            ? JSON.parse(authVerificationCookie)
                            : authVerificationCookie
                        codeVerifier = verificationData.code_verifier
                        this.logger.debug('Found code_verifier in cookie:', { hasCodeVerifier: !!codeVerifier })
                    }
                } catch (error) {
                    this.logger.warn('Failed to parse auth_verification cookie:', error)
                }

                // 标准 OIDC 授权码流程
                this.logger.debug('Processing authorization code flow', {
                    code: `${code.substring(0, 10)}...`,
                    state: `${state.substring(0, 10)}...`,
                    hasCodeVerifier: !!codeVerifier,
                })
                const payload = await this.oidcService.processAuthorizationCode(code, state, codeVerifier)
                return await this.processOIDCUser(payload, session, res)
            }

            throw new Error('未找到有效的用户信息')
        } catch (error) {
            this.logger.error(error)
            if (error instanceof HttpError) {
                throw error
            }
            throw new HttpError(400, `认证失败: ${error.message}`)
        }
    }

    /**
     * 处理 OIDC 用户信息
     */
    private async processOIDCUser(payload: JwtPayload, session: ISession, res: Response) {
        this.logger.debug(payload, 'OIDC payload')
        // nickname 比 name 更友好，更接近用户设定的用户名
        const { sub: auth0Id, email, email_verified, nickname, picture, name } = payload
        const username = nickname || name || email?.split('@')[0] || 'user'

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
            res.redirect(302, `/?state=oidc_login_${getRandomCode(16)}`)
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
            res.redirect(302, `/?state=oidc_login_${getRandomCode(16)}`)
            return
        }
        if (!ENABLE_REGISTER) {
            throw new HttpError(400, '当前不允许注册新用户！')
        }
        // 如果邮箱未注册，则创建新用户
        user = await this.repository.save(this.repository.create({
            username,
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
        res.redirect(302, `/?state=oidc_login_${getRandomCode(16)}`)
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
