import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { ProxyConfig, FindProxyConfig, CreateProxyConfig, UpdateProxyConfig } from '@/db/models/proxy-config.entity'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { getConditions } from '@/utils/check'
import { DicData } from '@/models/avue.dto'

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
    async dicData(@CurrentUser() user: User) {
        const conditions = getConditions(user)
        const data = await this.repository.find({
            where: {
                ...conditions,
            },
            order: {
                createdAt: 'DESC',
            },
            select: ['id', 'name'],
        })
        data.unshift({
            name: '不代理',
            id: null,
        } as any)
        return data
    }

}
