import { Body, Controller, Delete, Get, Header, Logger, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Express } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import { groupBy } from 'lodash'
import { Sub2 } from 'opml'
import { UseSession } from '@/decorators/use-session.decorator'
import { CreateFeed, Feed, FindFeed, QuickCreateFeed, UpdateFeed } from '@/db/models/feed.entity'
import { AclCrud, initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { HttpError } from '@/models/http-error'
import { checkAuth } from '@/utils/check'
import { TasksService } from '@/services/tasks/tasks.service'
import { isId } from '@/decorators/is-id.decorator'
import { opmlStringify, rssParserURL } from '@/utils/rss-helper'
import { AvueFormOption } from '@/interfaces/avue'

type File = Express.Multer.File

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
            description: description || '',
            imageUrl: image?.url,
            ...body,
            userId: user.id,
        }))
        if (feed.isEnabled) {
            await this.tasksService.enableFeedTask(feed, true)
            this.tasksService.getRssContent(feed, rss) // 同步 RSS 内容
        }
        return feed
    }

    @ApiOperation({ summary: '从 OPML 文件导入订阅' })
    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async importByOpml(@UploadedFile() file: File, @CurrentUser() user: User) {
        console.log(file)
    }

    @ApiResponse({ status: 200, type: String })
    @ApiOperation({ summary: '导出订阅为 OPML 文件' })
    @Header('Content-Type', 'application/xml; charset=UTF-8')
    @Get('export')
    async exportByOpml(@CurrentUser() user: User) {
        const feeds = await this.repository.find({
            where: {
                userId: user.id,
            },
            relations: ['category'],
        })

        const groups = groupBy(feeds, (feed) => feed.category?.name)

        const subs: Sub2[] = Object.entries(groups).map(([key, group]) => ({
                text: key,
                subs: group.map((feed) => ({
                        text: feed.title,
                        title: feed.title,
                        type: 'rss',
                        xmlUrl: feed.url,
                        description: feed.description,
                    })),
            }))
        return opmlStringify({
            version: '2.0',
            head: {
                title: 'RssImpact',
                dateCreated: new Date().toUTCString(),
                generator: 'CaoMeiYouRen',
            },
            body: {
                subs,
            },
        })
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
        if (oldFeed && oldFeed.id !== id) {
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
