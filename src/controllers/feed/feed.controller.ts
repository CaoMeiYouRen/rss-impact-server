import { Body, Controller, Delete, Get, Logger, Param, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { CreateFeed, Feed, FindFeed, QuickCreateFeed, UpdateFeed } from '@/db/models/feed.entity'
import { AclCrud, initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { HttpError } from '@/models/http-error'
import { checkAuth } from '@/utils/check'
import { TasksService } from '@/services/tasks/tasks.service'
import { isId } from '@/decorators/is-id.decorator'
import { rssParserURL } from '@/utils/rss-helper'
import { AvueFormOption } from '@/interfaces/avue'

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
    relations: ['hooks'],
    props: {
        label: 'title',
        value: 'id',
    },
})
@ApiTags('feed')
@Controller('feed')
export class FeedController {

    private readonly logger = new Logger(FeedController.name)

    constructor(@InjectRepository(Feed) private readonly repository: Repository<Feed>,
        private readonly tasksService: TasksService,
    ) {
    }

    @ApiResponse({ status: 200, type: Feed })
    @ApiOperation({ summary: '快速添加订阅的配置项' })
    @Get('quickCreate/option')
    async quickCreateOption(): Promise<AvueFormOption> {
        return {
            // title: '快速添加订阅',
            submitText: '添加', // 直接用 QuickCreateFeed 会获取不到 SetAclCrudField
            column: initAvueCrudColumn(Feed).filter((col) => ['url', 'cron', 'isEnabled', 'categoryId', 'hooks', 'isEnableProxy', 'proxyConfigId'].includes(col.prop),
            ),
        }
    }

    @ApiResponse({ status: 201, type: Feed })
    @ApiOperation({ summary: '快速添加订阅' })
    @Post('quickCreate')
    async quickCreate(@Body() body: QuickCreateFeed, @CurrentUser() user: User) {
        this.logger.debug(JSON.stringify(body, null, 4))
        const userId = user.id
        const { url } = body
        if (await this.repository.count({ where: { url, userId } })) {
            throw new HttpError(400, '已存在相同 URL 的订阅！')
        }
        const rss = await rssParserURL(url)
        const { title, description, image } = rss || {}
        const feed = await this.repository.save(this.repository.create({
            title,
            description,
            imageUrl: image?.url,
            ...body,
            userId: user.id,
        }))
        if (feed.isEnabled) {
            await this.tasksService.enableFeedTask(feed, true)
            await this.tasksService.getRssContent(feed, rss) // 同步 RSS 内容
        }
        return feed
    }

    @ApiResponse({ status: 201, type: Feed })
    @ApiOperation({ summary: '创建记录' })
    @Post('')
    async create(@Body() body: CreateFeed, @CurrentUser() user: User) {
        this.logger.debug(JSON.stringify(body, null, 4))
        const userId = user.id
        const { url } = body
        if (await this.repository.count({ where: { url, userId } })) {
            throw new HttpError(400, '已存在相同 URL 的订阅！')
        }
        delete body.user  // 以 userId 字段为准
        body.userId = user.id  // 以 userId 字段为准

        const feed = await this.repository.save(this.repository.create(body))
        if (feed.isEnabled) {
            await this.tasksService.enableFeedTask(feed, true)
        }
        return feed
    }

    @ApiResponse({ status: 200, type: Feed })
    @ApiOperation({ summary: '更新记录' })
    @Put('')
    async update(@Body() body: UpdateFeed, @CurrentUser() user: User) {
        this.logger.debug(JSON.stringify(body, null, 4))
        const id = body.id
        delete body.user  // 以 userId 字段为准
        if (!body.userId) {
            body.userId = user.id
        }
        const document = await this.repository.findOne({
            where: {
                id,
            },
            relations: ['user'],
        })
        if (!checkAuth(document, user)) {
            throw new HttpError(403, '该用户没有权限访问')
        }
        if (!document) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        const userId = user.id
        const { url } = body
        const oldFeed = await this.repository.findOne({
            where: {
                url,
                userId,
            },
        })
        if (oldFeed.id !== id) {
            throw new HttpError(400, '已存在相同 URL 的订阅！')
        }
        const updatedDocument = await this.repository.save(this.repository.create(body)) // 使用 save 解决多对多的情况下保存的问题
        if (updatedDocument.isEnabled) {
            await this.tasksService.disableFeedTask(updatedDocument, true) // 先禁用再启用
            await this.tasksService.enableFeedTask(updatedDocument, true)
        } else {
            await this.tasksService.disableFeedTask(updatedDocument, true)
        }
        return updatedDocument
    }

    @ApiResponse({ status: 200, type: Feed })
    @ApiOperation({ summary: '删除记录' })
    @Delete(':id')
    async delete(@Param('id') id: number, @CurrentUser() user: User) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const document = await this.repository.findOne({
            where: {
                id,
            },
            relations: ['user'],
        })
        if (!checkAuth(document, user)) {
            throw new HttpError(403, '该用户没有权限访问')
        }
        if (!document) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        await this.repository.delete(id)
        await this.tasksService.disableFeedTask(document, true)
        return document
    }
}
