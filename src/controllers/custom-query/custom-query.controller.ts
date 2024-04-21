import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { CustomQuery, FindCustomQuery, CreateCustomQuery, UpdateCustomQuery } from '@/db/models/custom-query.entity'

@UseSession()
@AclCrud({
    model: CustomQuery,
    config: {
        option: {
            title: '自定义查询',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindCustomQuery,
        },
        create: {
            dto: CreateCustomQuery,
        },
        update: {
            dto: UpdateCustomQuery,
        },
    },
})
@ApiTags('custom-query')
@Controller('custom-query')
export class CustomQueryController {
    constructor(@InjectRepository(CustomQuery) private readonly repository: Repository<CustomQuery>) {
    }
}
