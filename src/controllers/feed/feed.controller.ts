import { Controller, Logger } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { CreateFeed, Feed, FindFeed, UpdateFeed } from '@/db/models/feed.entity'
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
    routes: {
        find: {
            dto: FindFeed,
        },
        create: {
            dto: CreateFeed,
        },
        update: {
            dto: UpdateFeed,
        },
    },
    relations: ['category'],
})
@ApiTags('feed')
@Controller('feed')
export class FeedController {

    private readonly logger = new Logger(FeedController.name)

    constructor(@InjectRepository(Feed) private readonly repository: Repository<Feed>,
    ) {
    }

    // @ApiOperation({ summary: '创建记录' })
    // @Post('')
    // async create(@Body() body: CreateFeed, @CurrentUser() user: User) {
    //     this.logger.debug(JSON.stringify(body, null, 4))
    //     body.userId = user.id
    //     if (body.user) { // 以 userId 字段为准
    //         delete body.user
    //     }
    //     const feed = this.repository.create(body)
    //     const newDocument = await this.repository.save(feed)

    //     return newDocument
    // }

    // @ApiOperation({ summary: '更新记录' })
    // @Put('')
    // async update(@Body() body: UpdateFeed, @CurrentUser() user: User) {
    //     this.logger.debug(JSON.stringify(body, null, 4))
    //     const id = body.id
    //     if (body.userId && body.user) { // 以 userId 字段为准
    //         delete body.user
    //     }
    //     const document = await this.repository.findOne({
    //         where: {
    //             id,
    //         },
    //         relations: ['user'],
    //     })
    //     if (!checkAuth(document, user)) {
    //         throw new HttpError(403, '该用户没有权限访问')
    //     }
    //     if (!document) {
    //         throw new HttpError(404, '该 Id 对应的资源不存在！')
    //     }
    //     const feed = this.repository.create(body)
    //     const updatedDocument = await this.repository.save(feed)
    //     return updatedDocument
    // }
}
