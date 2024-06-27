import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { DailyCount, FindDailyCount } from '@/db/models/daily-count.entity'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { UseAdmin } from '@/decorators/use-admin.decorator'

@UseAdmin()
@AclCrud({
    model: DailyCount,
    config: {
        option: {
            title: '使用统计',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindDailyCount,
        },
        create: false,
        update: false,
        delete: false,
    },
})
@ApiTags('daily-count')
@Controller('daily-count')
export class DailyCountController { }
