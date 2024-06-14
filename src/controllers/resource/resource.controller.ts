import { Controller, Delete, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { FindResource, Resource } from '@/db/models/resource.entiy'
import { UseSession } from '@/decorators/use-session.decorator'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { ResourceService } from '@/services/resource/resource.service'
import { DicData } from '@/models/avue.dto'
import { getConditions } from '@/utils/check'

// 资源管理，admin 限定
@UseSession()
// @UseAdmin()
@AclCrud({
    model: Resource,
    routes: {
        find: {
            dto: FindResource,
        },
        create: false,
        update: false,
    },
    config: {
        option: {
            title: '资源管理',
            column: [],
        },
    },
    relations: [],
})
@ApiTags('resource')
@Controller('resource')
export class ResourceController {
    constructor(
        @InjectRepository(Resource) private readonly repository: Repository<Resource>,
        private readonly resourceService: ResourceService) {
    }

    @ApiResponse({ status: 200, type: [DicData] })
    @Get('typeDicData')
    async typeDicData(@CurrentUser() user: User) {
        const conditions = getConditions(user)
        const data = await this.repository
            .createQueryBuilder('resource')
            .where({
                ...conditions,
            })
            .select('resource.type', 'type')// 选择要 distinct 的列
            .distinct(true) // 启用 distinct
            .getRawMany() as { type: string }[]
        return data.filter((e) => e.type).map((e) => ({
            label: e.type,
            value: e.type,
        }))
    }

    @ApiOperation({ summary: '删除记录' })
    @Delete(':id')
    async delete(@Param('id') id: number, @CurrentUser() user: User) {
        return this.resourceService.delete(id, user)
    }
}
