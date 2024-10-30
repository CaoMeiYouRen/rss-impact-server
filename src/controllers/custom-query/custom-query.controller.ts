import { Body, Controller, Get, Param, Put, Query, Res } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOperator, In, MoreThanOrEqual, Repository } from 'typeorm'
import dayjs from 'dayjs'
import { Response } from 'express'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { CustomQuery, FindCustomQuery, CreateCustomQuery, UpdateCustomQuery } from '@/db/models/custom-query.entity'
import { Article } from '@/db/models/article.entity'
import { isId } from '@/decorators/is-id.decorator'
import { Data } from '@/interfaces/data'
import { HttpError } from '@/models/http-error'
import { filterArticles, articleToDataItem } from '@/utils/rss-helper'
import atom from '@/views/atom'
import rss from '@/views/rss'
import json from '@/views/json'
import { CacheService } from '@/services/cache/cache.service'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { checkAuth } from '@/utils/check'
import { to } from '@/utils/helper'

@AclCrud({
    model: CustomQuery,
    config: {
        option: {
            title: '自定义查询',
            column: [],
        },
    },
    routes: {
        config: {
            decorators: [UseSession()],
        },
        dicData: {
            decorators: [UseSession()],
        },
        findOne: {
            decorators: [UseSession()],
        },
        find: {
            dto: FindCustomQuery,
            decorators: [UseSession()],
        },
        create: {
            dto: CreateCustomQuery,
            decorators: [UseSession()],
        },
        update: {
            dto: UpdateCustomQuery,
            decorators: [UseSession()],
        },
        delete: {
            decorators: [UseSession()],
        },
    },
    relations: ['categories', 'feeds'],
})
@ApiTags('custom-query')
@Controller('custom-query')
export class CustomQueryController {
    constructor(
        @InjectRepository(CustomQuery) private readonly repository: Repository<CustomQuery>,
        @InjectRepository(Article) private readonly articlerepository: Repository<Article>,
        private readonly cacheService: CacheService,
    ) {
    }

    @ApiResponse({ status: 200, type: Object })
    // @UseAccessToken() , @CurrentUser() user: User
    @Get('rss/:id')
    async customQuery(@Param('id') id: number, @Query('key') key: string, @Res({ passthrough: false }) res: Response) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const cacheKey = `custom-query-rss:${id}`
        const cacheData = await this.cacheService.tryGet(cacheKey, async () => {
            const custom = await this.repository.findOne({ where: { id, key }, relations: ['categories', 'categories.feeds', 'feeds'] })
            if (!custom) {
                throw new HttpError(404, '该 Id 对应的资源不存在！')
            }
            if (key !== custom.key) {
                throw new HttpError(403, '错误的 key，没有权限访问！')
            }
            const { name, format, filter = {}, url, scope, categories = [], feeds = [], useAiSummary, appendAiSummary } = custom
            const { limit, time } = filter
            let feedId: number | FindOperator<number>
            const pubDate = time ? MoreThanOrEqual(dayjs().add(-time, 'seconds').toDate()) : undefined
            if (scope === 'feed') {
                if (!feeds?.length) {
                    throw new HttpError(400, '指定订阅时必须要选择订阅！')
                }
                feedId = In(feeds.map((e) => e.id))
            } else if (scope === 'category') {
                if (!categories?.length) {
                    throw new HttpError(400, '指定分类时必须要选择分类！')
                }
                feedId = In(categories.map((e) => e?.feeds?.map((f) => f?.id))?.flat()?.filter(Boolean))
            }

            const articles = await this.articlerepository.find({
                where: {
                    pubDate,
                    feedId,
                    userId: custom.userId,
                },
                take: limit || 20,
                order: {
                    pubDate: 'DESC',
                },
            })
            const filteredArticles = filterArticles(articles, custom)
            const data: Data = {
                title: name,
                link: url,
                feedLink: url,
                description: `自定义查询：${name}`,
                subtitle: `自定义查询：${name}`,
                author: 'CaoMeiYouRen',
                ttl: 300, // 5 分钟
                lastBuildDate: new Date().toUTCString(),
                item: filteredArticles.map((e) => articleToDataItem(e, { useAiSummary, appendAiSummary })),
            }
            const headers = {
                'Content-Type': '',
            }
            let body = ''
            switch (format) {
                case 'json':
                    headers['Content-Type'] = 'application/feed+json; charset=UTF-8'
                    body = json(data)
                    break
                case 'rss2.0':
                    headers['Content-Type'] = 'application/xml; charset=UTF-8'  // application/rss+xml
                    body = rss(data)
                    break
                case 'atom':
                    headers['Content-Type'] = 'application/xml; charset=UTF-8'  // application/atom+xml
                    body = atom(data)
                    break
                default:
                    throw new HttpError(400, '未知的输出格式！')
            }
            return {
                headers,
                body,
            }
        })

        const { headers, body } = cacheData
        if (!res.headersSent) {
            res.header('Content-Type', headers['Content-Type']).status(200).send(body)
        }

    }

    @UseSession()
    @ApiResponse({ status: 200, type: CustomQuery })
    @ApiOperation({ summary: '更新 CustomQuery' })
    @Put('')
    async update(@Body() body: UpdateCustomQuery, @CurrentUser() user: User) {
        const id = body.id
        delete body.user  // 以 userId 字段为准
        if (!body.userId) {
            body.userId = user.id
        }
        if (!id) {
            throw new HttpError(400, 'update 必须要有 id')
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
        const updatedDocument = await this.repository.save(this.repository.create(body)) // 使用 save 解决多对多的情况下保存的问题
        // 删除原有缓存
        const cacheKey = `custom-query-rss:${id}`
        await to(this.cacheService.del(cacheKey)) // 忽略错误
        return updatedDocument
    }

}
