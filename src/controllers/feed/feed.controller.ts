import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { Feed } from '@/db/models/feed.entity'
import { AclCrud } from '@/decorators/acl-crud.decorator'

@UseSession()
@AclCrud({
    model: Feed,
    config: {
        option: {
            title: '订阅管理',
            column: [],
        },
    },
    relations: ['category'],
})
@ApiTags('feed')
@Controller('feed')
export class FeedController {
    constructor(@InjectRepository(Feed) private readonly repository: Repository<Feed>) {
    }

}
