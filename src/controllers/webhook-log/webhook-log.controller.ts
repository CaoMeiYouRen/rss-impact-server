import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { WebhookLog } from '@/db/models/webhook-log.entity'

@UseSession()
@AclCrud({
    model: WebhookLog,
    config: {
        option: {
            title: 'Webhook和通知日志',
            column: [],
        },
    },
})
@ApiTags('webhook-log')
@Controller('webhook-log')
export class WebhookLogController {
    constructor(@InjectRepository(WebhookLog) private readonly repository: Repository<WebhookLog>) {
    }
}
