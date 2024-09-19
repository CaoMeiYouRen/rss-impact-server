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
import { ENABLE_ORIGIN_LIST, ENABLE_REGISTER } from '@/app.config'
import { CategoryService } from '@/services/category/category.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {

    constructor(@InjectRepository(User) private readonly repository: Repository<User>,
        private readonly categoryService: CategoryService,
    ) { }

    private readonly logger: Logger = new Logger(AuthController.name)

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

    @ApiResponse({ status: 201, type: ResponseDto })
    @ApiOperation({ summary: '登出' })
    @Post('logout')
    async logout(@CurrentUser() user: User, @Session() session: ISession) {
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
