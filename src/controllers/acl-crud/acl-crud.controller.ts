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
import { ApiOperation, ApiQuery } from '@nestjs/swagger'
import { Request } from 'express'
import { Repository } from 'typeorm'
import { isInt, min } from 'class-validator'
import { AvueCrudConfig, CrudRouteForFind } from '@/interfaces/avue'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { HttpError } from '@/models/http-error'
import { getConditions, checkAuth } from '@/utils/check'
import { PAGE_LIMIT_MAX } from '@/app.config'
import { Role } from '@/constant/role'
import { AclBase } from '@/db/models/acl-base.entity'
import { CrudPlaceholderDto } from '@/models/crud-placeholder.dto'

export interface ICrudQuery extends CrudRouteForFind {
    where?: any
    limit?: number
    page?: number
    skip?: number
    sort?: string | any
    populate?: string | any
    select?: string | any
    collation?: any
    relations?: any[]
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

    __AVUE_CRUD_CONFIG__

    constructor(
        public readonly repository: Repository<AclBase>, // Record<string, never> | any|
    ) {
    }

    @ApiOperation({ summary: '获取 config' })
    @Get('config')
    async config(): Promise<AvueCrudConfig> {
        return this.__AVUE_CRUD_CONFIG__ || {}
    }

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
        const conditions = getConditions(user)
        this.logger.debug(query)
        const [data, total] = await this.repository.findAndCount({
            where: {
                ...where,
                ...conditions,
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

    @ApiOperation({ summary: '查找记录' })
    @Get(':id')
    async findOne(@Param('id') id: number, @CurrentUser() user: User) {
        if (!isInt(id) || !min(id, 0)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const document = await this.repository.findOne({
            where: {
                id,
            },
        })
        if (!checkAuth(document, user)) {
            throw new HttpError(403, '该用户没有权限访问')
        }
        if (!document) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        return document
    }

    @ApiOperation({ summary: '创建记录' })
    @Post('')
    async create(@Body() body: CrudPlaceholderDto, @CurrentUser() user: User) {
        this.logger.debug(JSON.stringify(body, null, 4))
        body.user = user
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

    @ApiOperation({ summary: '更新记录' })
    @Put('')
    async update(@Body() body: CrudPlaceholderDto, @CurrentUser() user: User) {
        this.logger.debug(JSON.stringify(body, null, 4))
        const id = body.id
        if (body.createdAt) {
            delete body.createdAt
        }
        if (body.updatedAt) {
            delete body.updatedAt
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
        try {
            await this.repository.update(id, body)
            const updatedDocument = await this.repository.findOne({ where: { id } })
            return updatedDocument
        } catch (error) {
            this.logger.error(error)
            throw new HttpError(500, '更新记录失败')
        }
    }

    @ApiOperation({ summary: '删除记录' })
    @Delete(':id')
    async delete(@Param('id') id: number, @CurrentUser() user: User) {
        if (!isInt(id) || !min(id, 0)) {
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
        try {
            await this.repository.delete(id)
            return document
        } catch (error) {
            this.logger.error(error)
            throw new HttpError(500, '删除记录失败')
        }

    }
}
