import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Session } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { compare } from 'bcrypt'
import { ICrudQuery } from '../acl-crud/acl-crud.controller'
import { CreateUser, FindUser, UpdateMe, UpdateUser, User } from '@/db/models/user.entity'
import { CrudQuery } from '@/decorators/crud-query.decorator'
import { UserService } from '@/services/user/user.service'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { UseSession } from '@/decorators/use-session.decorator'
import { UseAdmin } from '@/decorators/use-admin.decorator'
import { AclCrud, initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { __DEV__, PAGE_LIMIT_MAX } from '@/app.config'
import { AvueCrudConfig, DicData, AvueCrudOption } from '@/models/avue.dto'
import { transformQueryOperator } from '@/utils/helper'
import { Role } from '@/constant/role'
import { HttpError } from '@/models/http-error'
import { ResponseDto } from '@/models/response.dto'
import { ResetPasswordDto } from '@/models/reset-password.dto'
import { ISession } from '@/interfaces/session'

@UseSession()
@AclCrud({
    model: User,
    config: {
        option: {
            title: '用户管理',
            column: [],
        },
    },
    routes: {
    },
    relations: [],
})
@ApiTags('user')
@Controller('user')
export class UserController {

    private readonly logger: Logger = new Logger(UserController.name)

    __AVUE_CRUD_CONFIG__: AvueCrudConfig

    constructor(@InjectRepository(User) private readonly repository: Repository<User>,
        private readonly userService: UserService,
    ) { }

    @ApiResponse({ status: 200, type: AvueCrudConfig })
    @UseAdmin()
    @ApiOperation({ summary: '获取 config' })
    @Get('config')
    async config(): Promise<AvueCrudConfig> {
        return UserController.prototype.__AVUE_CRUD_CONFIG__ || {} as any
    }

    @ApiQuery({
        name: 'query',
        type: String,
        required: false,
        description: 'Query options',
    })
    @ApiResponse({ status: 200, type: FindUser })
    @UseAdmin()
    @Get('')
    async find(@CrudQuery('query') query: ICrudQuery) {
        const {
            where = {},
            page = 1,
            sort = {},
            relations = [],
        } = query
        let { limit = 10, skip = 0 } = query
        limit = Math.min(limit, PAGE_LIMIT_MAX)
        skip = skip || (page - 1) * limit
        __DEV__ && this.logger.debug(query)
        const [data, total] = await this.repository.findAndCount({
            where: {
                ...transformQueryOperator(where),
            },
            skip,
            take: limit,
            order: sort,
            relations,
        })
        return {
            total,
            data,
            lastPage: Math.ceil(total / limit),
            currentPage: page,
        }
    }

    @ApiResponse({ status: 200, type: AvueCrudOption })
    @ApiOperation({ summary: '获取个人信息 option' })
    @Get('me/option')
    async meOption(@CurrentUser() user: User) {
        return {
            title: '个人信息',
            submitBtn: true,
            emptyBtn: false,
            column: initAvueCrudColumn(User).map((col) => {
                let hide = false
                const showProps = ['id', 'username', 'email']
                if (!showProps.includes(col.prop)) {
                    hide = true
                }
                if (['roles'].includes(col.prop) && user?.roles?.includes(Role.admin)) {
                    hide = false
                }
                const disabled = ['id', 'roles', 'accessToken'].includes(col.prop)
                const readonly = ['id', 'roles', 'accessToken'].includes(col.prop)

                return {
                    ...col,
                    hide,
                    readonly,
                    disabled,
                    span: 24,
                    labelWidth: 120,
                }
            }),
        }
    }

    @ApiOperation({ summary: '获取个人信息' })
    @ApiResponse({ status: 200, type: User })
    @Get('me')
    async me(@CurrentUser() user: User) {
        return user
    }

    @ApiOperation({ summary: '更新个人信息' })
    @ApiResponse({ status: 201, type: User })
    @Post('me')
    async updateMe(@Body() body: UpdateMe, @CurrentUser() user: User) {
        // demo 用户禁用用户名/邮箱修改
        if (user.roles.includes(Role.demo)) {
            throw new HttpError(400, 'demo 用户禁止修改个人信息！')
        }
        if (body.username && body.username !== user.username && await this.userService.findOne({ username: body.username })) {
            throw new HttpError(400, '用户名已存在！')
        }
        if (body.email && body.email !== user.email && await this.userService.findOne({ email: body.email })) {
            throw new HttpError(400, '邮箱已存在！')
        }
        const newUser = await this.userService.update(body)
        return newUser
    }

    @ApiResponse({ status: 200, type: AvueCrudOption })
    @ApiOperation({ summary: '获取重置密码 option' })
    @Get('resetPassword/option')
    async resetPasswordOption() {
        const column = [...initAvueCrudColumn(ResetPasswordDto), {
            label: '确认密码',
            prop: 'checkPassword',
            type: 'password',
        }].map((col) => ({
            ...col,
            span: 24,
            labelWidth: 120,
        }))

        return {
            title: '重置密码',
            submitBtn: true,
            emptyBtn: true,
            column,
        }
    }

    @UseSession()
    @Post('resetPassword')
    @ApiOperation({ summary: '重置密码' })
    @ApiResponse({ status: 201, type: ResponseDto })
    async resetPassword(@Body() body: ResetPasswordDto, @CurrentUser() currentUser: User, @Session() session: ISession) {
        // demo 用户禁用用户名/邮箱修改
        if (currentUser.roles.includes(Role.demo)) {
            throw new HttpError(400, 'demo 用户禁止修改密码！')
        }
        const user = await this.repository
            .createQueryBuilder('user')
            .where({
                id: currentUser.id,
            })
            .addSelect('user.password')
            .getOne()
        if (!user) {
            throw new HttpError(400, '该用户名对应的用户不存在')
        }
        if (!await compare(body.oldPassword, user.password)) {
            throw new HttpError(400, '旧密码错误')
        }
        user.password = body.newPassword
        await this.repository.save(user)
        session?.destroy((error) => {
            if (error) {
                this.logger.error(error?.message, error?.stack)
            }
        })
        return new ResponseDto({
            message: '修改密码成功！',
        })
    }

    @ApiResponse({ status: 200, type: [DicData] })
    @ApiOperation({ summary: '获取 dicData' })
    @UseAdmin()
    @Get('dicData')
    async dicData() {
        return this.userService.dicData()
    }

    @ApiResponse({ status: 200, type: User })
    @UseAdmin()
    @Get(':id')
    async findOne(@Param('id') id: number) {
        return this.userService.findOneById(id)
    }

    @ApiResponse({ status: 201, type: User })
    @UseAdmin()
    @Post('')
    async create(@Body() body: CreateUser) {
        return this.userService.create(body)
    }

    @ApiResponse({ status: 200, type: User })
    @UseAdmin()
    @Put('')
    async update(@Body() body: UpdateUser) {
        return this.userService.update(body)
    }

    @ApiOperation({ summary: '删除用户。仅返回 id 字段' })
    @ApiResponse({ status: 200, type: User })
    @UseAdmin()
    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.userService.delete(id)
    }

}
