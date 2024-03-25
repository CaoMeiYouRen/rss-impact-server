import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Resource } from '@/db/models/resource.entiy'
import { UseAdmin } from '@/decorators/use-admin.decorator'

// 资源管理，admin 限定
// @UseSession()
@UseAdmin()
@AclCrud({
    model: Resource,
    routes: {
        create: false,
        update: false,
        // delete: {
        //     decorators: [UseAdmin()],
        // },
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
    constructor(@InjectRepository(Resource) private readonly repository: Repository<Resource>) {
    }
}
