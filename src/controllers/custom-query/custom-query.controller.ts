import { Controller, Get, Param, Query, Res } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
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
    relations: ['categories'],
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
    // TODO 优化自定义查询在更新后的缓存逻辑
    @ApiResponse({ status: 200, type: Object })
    // @UseAccessToken() , @CurrentUser() user: User
    @Get('rss/:id')
    async customQuery(@Param('id') id: number, @Query('key') key: string, @Res({ passthrough: false }) res: Response) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const cacheKey = `custom-query-rss:${id}`
        const cacheData = await this.cacheService.tryGet(cacheKey, async () => {
            const custom = await this.repository.findOne({ where: { id, key }, relations: ['categories', 'categories.feeds', 'feed'] })
            if (!custom) {
                throw new HttpError(404, '该 Id 对应的资源不存在！')
            }
            if (key !== custom.key) {
                throw new HttpError(403, '错误的 key，没有权限访问！')
            }
            const { name, format, filter = {}, url, scope, categories = [], feed, useAiSummary, appendAiSummary } = custom
            const { limit, time } = filter
            let feedId: number | FindOperator<number>
            const pubDate = time ? MoreThanOrEqual(dayjs().add(-time, 'seconds').toDate()) : undefined
            if (scope === 'feed') {
                if (!feed?.id) {
                    throw new HttpError(400, '指定订阅时必须要选择订阅！')
                }
                feedId = feed.id
            } else if (scope === 'category') {
                if (!categories?.length) {
                    throw new HttpError(400, '指定分组时必须要选择分组！')
                }
                // const categoryList = await this.categoryRepository.find({
                //     where: {
                //         id: In(categories.map((e) => e.id)),
                //     },
                //     relations: ['feeds'],
                // })
                feedId = In(categories.map((e) => e?.feeds?.map((f) => f?.id))?.flat()?.filter(Boolean))
            }

            const articles = await this.articlerepository.find({
                where: {
                    pubDate,
                    feedId,
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

}
