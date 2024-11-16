import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ICrudQuery } from '../acl-crud/acl-crud.controller'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { ProxyConfig, FindProxyConfig, CreateProxyConfig, UpdateProxyConfig } from '@/db/models/proxy-config.entity'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { getConditions } from '@/utils/check'
import { DicData } from '@/models/avue.dto'
import { CrudQuery } from '@/decorators/crud-query.decorator'
import { PAGE_LIMIT_MAX } from '@/app.config'
import { Role } from '@/constant/role'

@UseSession()
@AclCrud({
    model: ProxyConfig,
    config: {
        option: {
            title: '代理配置管理',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindProxyConfig,
        },
        create: {
            dto: CreateProxyConfig,
        },
        update: {
            dto: UpdateProxyConfig,
        },
    },
    relations: [],
    props: {
        label: 'name',
        value: 'id',
    },
})
@ApiTags('proxy-config')
@Controller('proxy-config')
export class ProxyConfigController {
    constructor(@InjectRepository(ProxyConfig) private readonly repository: Repository<ProxyConfig>) {
    }

    @ApiResponse({ status: 200, type: [DicData] })
    @Get('dicData')
    async dicData(@CrudQuery('query') query: ICrudQuery, @CurrentUser() user: User) {
        const {
            page = 1,
            where = {},
        } = query
        let { limit = 1000, skip = 0 } = query
        limit = user?.roles?.includes(Role.admin) ? limit : Math.min(limit, PAGE_LIMIT_MAX)
        skip = skip || (page - 1) * limit
        const conditions = getConditions(user, where)
        const data = await this.repository.find({
            where: {
                ...conditions,
            },
            order: {
                id: 'DESC',
                createdAt: 'DESC',
            },
            select: ['id', 'name'],
            skip,
            take: limit,
        })
        data.unshift({
            name: '不代理',
            id: null,
        } as any)
        return data
    }

}
