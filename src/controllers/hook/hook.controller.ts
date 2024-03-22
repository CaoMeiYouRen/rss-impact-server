import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Hook } from '@/db/models/hook.entity'

@UseSession()
@AclCrud({
    model: Hook,
    config: {
        option: {
            title: 'Hook管理',
            column: [],
        },
    },
    relations: [],
})
@ApiTags('hook')
@Controller('hook')
export class HookController {
    constructor(@InjectRepository(Hook) private readonly repository: Repository<Hook>) {
    }
}
