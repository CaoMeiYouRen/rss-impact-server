import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { FindWebhookLog, WebhookLog } from '@/db/models/webhook-log.entity'

@UseSession()
@AclCrud({
    model: WebhookLog,
    routes: {
        find: {
            dto: FindWebhookLog,
        },
        create: false,
        update: false,
    },
    config: {
        option: {
            title: 'Webhook和通知日志',
            column: [],
        },
    },
    relations: ['articles'],
})
@ApiTags('webhook-log')
@Controller('webhook-log')
export class WebhookLogController {
    constructor(@InjectRepository(WebhookLog) private readonly repository: Repository<WebhookLog>) {
    }
}

