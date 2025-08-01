import { Body, Controller, Delete, Get, Header, Logger, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FileInterceptor } from '@nestjs/platform-express'
import { groupBy } from 'lodash'
import { Sub2 } from 'opml'
import { plainToInstance } from 'class-transformer'
import { UseSession } from '@/decorators/use-session.decorator'
import { CreateFeed, Feed, FindFeed, QuickCreateFeed, UpdateFeed } from '@/db/models/feed.entity'
import { AclCrud, initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { HttpError } from '@/models/http-error'
import { checkAuth } from '@/utils/check'
import { TasksService } from '@/services/tasks/tasks.service'
import { isId } from '@/decorators/is-id.decorator'
import { opmlParse, opmlStringify, rssParserURL } from '@/utils/rss-helper'
import { AvueFormOption } from '@/interfaces/avue'
import { FileUploadDto } from '@/models/file-upload.dto'
import { Category } from '@/db/models/category.entity'
import { to } from '@/utils/helper'
import { __DEV__, DEFAULT_FEED_CRON } from '@/app.config'
import { AvueCrudOption } from '@/models/avue.dto'
import { CategoryService } from '@/services/category/category.service'

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
    relations: ['hooks', 'customQueries'],
    props: {
        label: 'title',
        value: 'id',
    },
})
@ApiTags('feed')
@Controller('feed')
export class FeedController {

    private readonly logger = new Logger(FeedController.name)

    constructor(
        @InjectRepository(Feed) private readonly repository: Repository<Feed>,
        private readonly tasksService: TasksService,
        private readonly categoryService: CategoryService,
    ) {
    }

    @ApiResponse({ status: 200, type: AvueCrudOption })
    @ApiOperation({ summary: '快速添加订阅的配置项' })
    @Get('quickCreate/option')
    async quickCreateOption(@CurrentUser() user: User): Promise<AvueFormOption> {
        //  直接用 QuickCreateFeed 会获取不到 SetAclCrudField
        const uncategorizedId = (await this.categoryService.findOrCreateUncategorizedCategory(user))?.id
        const column = initAvueCrudColumn(Feed)
            .filter((col) => ['url', 'cron', 'isEnabled', 'categoryId', 'hooks', 'isEnableProxy', 'proxyConfigId'].includes(col.prop))
            .map((col) => {
                if (col.prop === 'categoryId') {
                    col.value = uncategorizedId
                    return col
                }
                return col
            })
        return {
            // title: '快速添加订阅',
            submitText: '添加',
            column,
        }
    }

    @ApiResponse({ status: 201, type: Feed })
    @ApiOperation({ summary: '快速添加订阅' })
    @Post('quickCreate')
    async quickCreate(@Body() body: QuickCreateFeed, @CurrentUser() user: User) {
        __DEV__ && this.logger.debug(JSON.stringify(body, null, 4))
        const userId = user.id
        const { url } = body
        if (await this.repository.count({ where: { url, userId } })) {
            throw new HttpError(400, '已存在相同 URL 的订阅！')
        }
        const rss = await rssParserURL(url)
        const { title, description, image } = rss || {}
        // TODO 修复 postgres 数据库插入新数据时，bigserial 类型的 id 返回的是 string 类型
        const feed = await this.repository.save(this.repository.create({
            title,
            description: description || '',
            imageUrl: image?.url,
            ...body,
            userId: user.id,
            isFullText: false,
        }))
        if (feed.isEnabled) {
            await this.tasksService.enableFeedTask(feed, true)
            this.tasksService.getRssContent(feed, rss) // 同步 RSS 内容
        }
        return feed
    }

    @ApiResponse({ status: 200, type: AvueCrudOption })
    @ApiOperation({ summary: '导入 OPML 文件的配置项' })
    @Get('import/option')
    async importByOpmlOption(): Promise<AvueFormOption> {
        return {
            submitBtn: false,
            emptyBtn: false,
            column: [
                {
                    label: 'OPML文件',
                    prop: 'file',
                    type: 'upload',
                    // listType: 'picture-card',
                    accept: '.xml, .opml',
                    limit: 1,
                    fileSize: 10000,
                    span: 24,
                    tip: '只能上传xml/opml文件，且不超过10M',
                    action: '/feed/import',
                },
            ],
        }
    }

    @ApiOperation({ summary: '从 OPML 文件导入订阅' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: '要上传的文件',
        type: FileUploadDto,
    })
    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    // eslint-disable-next-line no-undef
    async importByOpml(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
        const fileText = file.buffer.toString('utf-8')
        const opmlResult = await opmlParse(fileText)
        // console.log(opmlResult)
        const subs = opmlResult?.body?.subs
        const categories: Pick<Category, 'id' | 'name'>[] = []
        const feeds: Feed[] = []
        // 创建 未分类 项 Uncategorized
        const uncategorizedId = (await this.categoryService.findOrCreateUncategorizedCategory(user))?.id

        for await (const sub of subs) {
            if (!sub.xmlUrl && sub.text) { // 如果在第一层，且没有 xmlUrl，则为分类
                const categoryName = sub.text
                const categoryId = (await this.categoryService.findOrCreateCategory(categoryName, user)).id
                categories.push({
                    name: categoryName,
                    id: categoryId,
                })
            }
            if (sub.xmlUrl) { // 如果有 xmlUrl 则为 未分类 订阅
                const newFeed = plainToInstance(Feed, {
                    url: sub.xmlUrl,
                    title: sub.text,
                    cron: DEFAULT_FEED_CRON,
                    isEnabled: true,
                    categoryId: uncategorizedId,
                    userId: user.id,
                    hooks: [],
                }, {
                    enableCircularCheck: true,

                })
                const [error, feed] = await to(this.create(newFeed, user))
                if (error) {
                    this.logger.error(error?.message, error?.stack)
                } else if (feed) {
                    feeds.push(feed)
                }
            }
            if (sub.subs?.length) { // 如果有子项，则为该分类下的项
                for await (const subItem of sub.subs) {
                    if (subItem.xmlUrl && subItem.text) {
                        const newFeed = plainToInstance(Feed, {
                            url: subItem.xmlUrl,
                            title: subItem.text,
                            cron: DEFAULT_FEED_CRON,
                            isEnabled: true,
                            categoryId: categories.find((e) => e.name === sub.text)?.id,
                            userId: user.id,
                            hooks: [],
                        }, {
                            enableCircularCheck: true,

                        })
                        const [error, feed] = await to(this.create(newFeed, user))
                        if (error) {
                            this.logger.error(error?.message, error?.stack)
                        } else if (feed) {
                            feeds.push(feed)
                        }
                    }
                }
            }
        }
        return feeds
    }

    /**
     * 获取 feed 的关系
     * @param feed
     * @returns
     */
    private async getFeedRelations(feed: Feed) {
        return this.repository.findOne({ where: { id: feed.id }, relations: ['proxyConfig', 'hooks', 'hooks.proxyConfig'] })
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
                description: feed.description || '',
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
        __DEV__ && this.logger.debug(JSON.stringify(body, null, 4))
        const userId = user.id
        const { url } = body
        if (await this.repository.count({ where: { url, userId } })) {
            throw new HttpError(400, '已存在相同 URL 的订阅！')
        }
        delete body.user  // 以 userId 字段为准
        body.userId = user.id  // 以 userId 字段为准

        const feed = await this.repository.save(this.repository.create(body))
        if (feed.isEnabled) {
            await this.tasksService.enableFeedTask(await this.getFeedRelations(feed), true)
        }
        return feed
    }

    @ApiResponse({ status: 200, type: Feed })
    @ApiOperation({ summary: '更新记录' })
    @Put('')
    async update(@Body() body: UpdateFeed, @CurrentUser() user: User) {
        __DEV__ && this.logger.debug(JSON.stringify(body, null, 4))
        const id = body.id
        delete body.user  // 以 userId 字段为准
        if (!body.userId) {
            body.userId = user.id
        }
        if (!body.proxyConfigId) {
            delete body.proxyConfig
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
        const updatedFeed = await this.repository.save(this.repository.create(body)) // 使用 save 解决多对多的情况下保存的问题
        if (updatedFeed.isEnabled) {
            await this.tasksService.disableFeedTask(updatedFeed, true) // 先禁用再启用
            await this.tasksService.enableFeedTask(await this.getFeedRelations(updatedFeed), true)
        } else {
            await this.tasksService.disableFeedTask(updatedFeed, true)
        }
        return updatedFeed
    }

    @ApiResponse({ status: 200, type: Feed })
    @ApiOperation({ summary: '删除记录' })
    @Delete(':id')
    async delete(@Param('id') id: number, @CurrentUser() user: User) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const feed = await this.repository.findOne({
            where: {
                id,
            },
            relations: ['user'],
        })
        if (!checkAuth(feed, user)) {
            throw new HttpError(403, '该用户没有权限访问')
        }
        if (!feed) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        await this.repository.delete(id)
        await this.tasksService.disableFeedTask(feed, true)
        return feed
    }
}
