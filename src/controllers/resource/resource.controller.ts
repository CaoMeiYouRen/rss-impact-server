import { Controller, Delete, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { FindResource, Resource } from '@/db/models/resource.entiy'
import { UseSession } from '@/decorators/use-session.decorator'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { ResourceService } from '@/services/resource/resource.service'

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
            title: '文件资源管理',
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

    @ApiOperation({ summary: '删除记录' })
    @Delete(':id')
    async delete(@Param('id') id: number, @CurrentUser() user: User) {
        return this.resourceService.delete(id, user)
    }
}
