import {
    Get,
    Param,
    Post,
    Put,
    Delete,
    Body,
    createParamDecorator,
    ExecutionContext,
    Logger,
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger'
import { Request } from 'express'
import { Repository } from 'typeorm'
import { merge, uniq } from 'lodash'
import { CrudRouteForFind } from '@/interfaces/avue'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { HttpError } from '@/models/http-error'
import { getConditions, checkAuth } from '@/utils/check'
import { __DEV__, PAGE_LIMIT_MAX } from '@/app.config'
import { Role } from '@/constant/role'
import { AclBase } from '@/db/models/acl-base.entity'
import { CrudPlaceholderDto } from '@/models/crud-placeholder.dto'
import { AclOptions } from '@/decorators/acl-crud.decorator'
import { isId } from '@/decorators/is-id.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { AvueCrudConfig, DicData } from '@/models/avue.dto'

export class ICrudQuery implements CrudRouteForFind {
    /**
     * 查询条件
     */
    where?: Record<string, any>
    /**
     * 数量限制
     */
    limit?: number
    /**
     * 页数
     */
    page?: number
    /**
     * 跳过多少页
     */
    skip?: number
    /**
     * 排序
     */
    sort?: any
    select?: string | any
    collation?: any
    /**
     * 要关联其他表关系的字段
     */
    relations?: string[]
}

export const CrudQuery = createParamDecorator((name, ctx: ExecutionContext) => {
    const req: Request = ctx.switchToHttp().getRequest()
    try {
        return JSON.parse(String(req.query[name] || ''))
    } catch (e) {
        return {}
    }
})

export class AclCrudController {

    private readonly logger: Logger

    __AVUE_CRUD_CONFIG__: AvueCrudConfig

    __OPTIONS__: AclOptions

    constructor(
        public readonly repository: Repository<AclBase>, // Record<string, never> | any|
    ) {
    }

    @ApiResponse({ status: 200, type: AvueCrudConfig })
    @ApiOperation({ summary: '获取 config' })
    @Get('config')
    async config(@CurrentUser() user: User): Promise<AvueCrudConfig> {
        const { option } = this.__AVUE_CRUD_CONFIG__
        if (user?.roles?.includes(Role.admin)) {
            return {
                option: {
                    ...option,
                    column: option.column.map((col) => {
                        if (col.prop === 'userId') {
                            col.value = user.id
                        }
                        return col
                    }),
                },
            }
        }
        return {
            option: {
                ...option,  // 非 admin 用户不显示 useId
                column: option.column.filter((col) => col.prop !== 'userId'),
            },
        }
    }

    @ApiResponse({ status: 200, type: [DicData] })
    @Get('dicData')
    async dicData(@CrudQuery('query') query: ICrudQuery, @CurrentUser() user: User) {
        if (!this?.__OPTIONS__?.props) {
            throw new HttpError(400, '该路由未定义字典数据')
        }
        const {
            page = 1,
            where = {},
        } = query
        let { limit = user?.roles?.includes(Role.admin) ? 10000 : 1000, skip = 0 } = query
        limit = user?.roles?.includes(Role.admin) ? limit : Math.min(limit, PAGE_LIMIT_MAX)
        skip = skip || (page - 1) * limit
        const conditions = getConditions(user, where)
        const data = await this.repository.find({
            where: {
                ...conditions,
            },
            skip,
            take: limit,
            order: {
                id: 'DESC',
                createdAt: 'DESC',
            },
            select: [this?.__OPTIONS__?.props?.label, this?.__OPTIONS__?.props?.value] as any[],
        })
        return data
    }

    @ApiResponse({ status: 200, type: FindPlaceholderDto })
    @ApiOperation({ summary: '查找所有记录' })
    @ApiQuery({
        name: 'query',
        type: String,
        required: false,
        description: 'Query options',
    })
    @Get('')
    async find(@CrudQuery('query') query: ICrudQuery, @CurrentUser() user: User) {
        const {
            where = {},
            page = 1,
            sort = {},
            relations = [],
        } = query
        let { limit = 10, skip = 0 } = query
        limit = user?.roles?.includes(Role.admin) ? limit : Math.min(limit, PAGE_LIMIT_MAX)
        skip = skip || (page - 1) * limit
        const conditions = getConditions(user, where)
        __DEV__ && this.logger.debug(query)
        const [data, total] = await this.repository.findAndCount({
            where: {
                ...conditions,
            },
            skip,
            take: limit,
            order: merge({
                id: 'DESC',
                createdAt: 'DESC',
            }, this?.__OPTIONS__?.order, sort),
            relations: uniq([...relations, ...this?.__OPTIONS__?.relations || []]),
            select: uniq([...this?.__OPTIONS__?.select || []]) as any,
        })
        return {
            total,
            data,
            lastPage: Math.ceil(total / limit),
            currentPage: page,
        }
    }

    @ApiResponse({ status: 200, type: CrudPlaceholderDto })
    @ApiOperation({ summary: '查找记录' })
    @Get(':id')
    async findOne(@Param('id') id: number, @CurrentUser() user: User) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const document = await this.repository.findOne({
            where: {
                id,
            },
            relations: this?.__OPTIONS__?.relations,
        })
        if (!checkAuth(document, user)) {
            throw new HttpError(403, '该用户没有权限访问')
        }
        if (!document) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        return document
    }

    @ApiResponse({ status: 201, type: CrudPlaceholderDto })
    @ApiOperation({ summary: '创建记录' })
    @Post('')
    async create(@Body() body: CrudPlaceholderDto, @CurrentUser() user: User) {
        __DEV__ && this.logger.debug(JSON.stringify(body, null, 4))

        delete body.user  // 以 userId 字段为准
        body.userId = user.id  // 以 userId 字段为准
        if (body.id) {
            delete body.id
        }
        if (body.createdAt) {
            delete body.createdAt
        }
        if (body.updatedAt) {
            delete body.updatedAt
        }
        const newDocument = await this.repository.save(this.repository.create(body))
        return newDocument
    }

    @ApiResponse({ status: 200, type: CrudPlaceholderDto })
    @ApiOperation({ summary: '更新记录' })
    @Put('')
    async update(@Body() body: CrudPlaceholderDto, @CurrentUser() user: User) {
        __DEV__ && this.logger.debug(JSON.stringify(body, null, 4))
        const id = body.id
        delete body.user  // 以 userId 字段为准
        if (!body.userId) {
            body.userId = user.id
        }
        if (body.createdAt) {
            delete body.createdAt
        }
        if (body.updatedAt) {
            delete body.updatedAt
        }
        if (!id) {
            throw new HttpError(400, 'update 必须要有 id')
        }
        const document = await this.repository.findOne({
            where: {
                id,
            },
            relations: ['user'],
        })
        if (!checkAuth(document, user)) {
            throw new HttpError(403, '该用户没有权限访问')
        }
        if (!document) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        const updatedDocument = await this.repository.save(this.repository.create(body)) // 使用 save 解决多对多的情况下保存的问题
        return updatedDocument
    }

    @ApiResponse({ status: 200, type: CrudPlaceholderDto })
    @ApiOperation({ summary: '删除记录' })
    @Delete(':id')
    async delete(@Param('id') id: number, @CurrentUser() user: User) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const document = await this.repository.findOne({
            where: {
                id,
            },
            relations: ['user'],
        })
        if (!checkAuth(document, user)) {
            throw new HttpError(403, '该用户没有权限访问')
        }
        if (!document) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        // try {
        await this.repository.delete(id)
        return document
        // } catch (error) {
        //     this.logger.error(error)
        //     throw new HttpError(500, '删除记录失败')
        // }
    }
}
