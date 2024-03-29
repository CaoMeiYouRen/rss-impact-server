import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Category } from '@/db/models/category.entity'

@UseSession()
@AclCrud({
    model: Category,
    config: {
        option: {
            title: '分组管理',
            column: [],
        },
    },
    relations: ['feeds'],
})
@ApiTags('category')
@Controller('category')
export class CategoryController {
    constructor(@InjectRepository(Category) private readonly repository: Repository<Category>) {
    }
}
