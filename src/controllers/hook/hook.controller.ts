import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { CreateHook, FindHook, Hook, UpdateHook } from '@/db/models/hook.entity'

@UseSession()
@AclCrud({
    model: Hook,
    config: {
        option: {
            title: 'Hook管理',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindHook,
        },
        create: {
            dto: CreateHook,
        },
        update: {
            dto: UpdateHook,
        },
    },
    relations: [],
    props: {
        label: 'name',
        value: 'id',
    },
})
@ApiTags('hook')
@Controller('hook')
export class HookController {
    constructor(@InjectRepository(Hook) private readonly repository: Repository<Hook>) {
    }
}
