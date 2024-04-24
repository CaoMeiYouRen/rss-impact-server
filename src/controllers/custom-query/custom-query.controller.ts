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
import { Category } from '@/db/models/category.entity'

@UseSession()
@AclCrud({
    model: CustomQuery,
    config: {
        option: {
            title: '自定义查询',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindCustomQuery,
        },
        create: {
            dto: CreateCustomQuery,
        },
        update: {
            dto: UpdateCustomQuery,
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
        @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    ) {
    }
    // TODO 增加按资源 size 筛选
    @ApiResponse({ status: 200, type: Object })
    // @UseAccessToken() , @CurrentUser() user: User
    @Get('rss/:id')
    async customQuery(@Param('id') id: number, @Query('key') key: string, @Res() res: Response) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const custom = await this.repository.findOne({ where: { id, key }, relations: ['categories', 'feed'] })
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
            const categoryList = await this.categoryRepository.find({
                where: {
                    id: In(categories.map((e) => e.id)),
                },
                relations: ['feeds'],
            })
            feedId = In(categoryList.map((e) => e.feeds.map((f) => f.id)).flat())
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
            author: 'CaoMeiYouRen',
            ttl: 300, // 5 分钟
            item: filteredArticles.map((e) => articleToDataItem(e, { useAiSummary, appendAiSummary })),
        }

        switch (format) {
            case 'json':
                if (!res.headersSent) {
                    res.header('Content-Type', 'application/feed+json; charset=UTF-8').status(200).json(json(data))
                }
                return
            case 'rss2.0':
                // application/rss+xml
                if (!res.headersSent) {
                    res.header('Content-Type', 'application/xml; charset=UTF-8').status(200).send(rss(data))
                }
                return
            case 'atom':
                // application/atom+xml
                if (!res.headersSent) {
                    res.header('Content-Type', 'application/xml; charset=UTF-8').status(200).send(atom(data))
                }
                return
            default:
                throw new HttpError(400, '未知的输出格式！')
        }
    }

}
