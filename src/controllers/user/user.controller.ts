import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { ICrudQuery } from '../acl-crud/acl-crud.controller'
import { CreateUser, FindUser, UpdateUser, User } from '@/db/models/user.entity'
import { CrudQuery } from '@/decorators/crud-query.decorator'
import { UserService } from '@/services/user/user.service'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { UseSession } from '@/decorators/use-session.decorator'
import { UseAdmin } from '@/decorators/use-admin.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { AvueCrudConfig } from '@/interfaces/avue'
import { PAGE_LIMIT_MAX } from '@/app.config'
import { AvueCrudConfigImpl, DicData } from '@/models/avue.dto'

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
        dicData: false,
    },
    relations: [],
})
@ApiTags('user')
@Controller('user')
export class UserController {

    __AVUE_CRUD_CONFIG__: AvueCrudConfig

    constructor(@InjectRepository(User) private readonly repository: Repository<User>,
        private readonly userService: UserService,
    ) { }

    @ApiResponse({ status: 200, type: AvueCrudConfigImpl })
    @UseAdmin()
    @ApiOperation({ summary: '获取 config' })
    @Get('config')
    async config(): Promise<AvueCrudConfig> {
        return UserController.prototype.__AVUE_CRUD_CONFIG__ || {}
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
        const [data, total] = await this.repository.findAndCount({
            where: {
                ...where,
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

    @ApiOperation({ summary: '获取个人信息' })
    @ApiResponse({ status: 200, type: User })
    @Get('me')
    async me(@CurrentUser() user: User) {
        return user
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
