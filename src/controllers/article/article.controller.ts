import { Controller, Get, Param, Query, Res } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThanOrEqual, Repository } from 'typeorm'
import dayjs from 'dayjs'
import { Response } from 'express'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Article, FindArticle } from '@/db/models/article.entity'
import { CustomQuery } from '@/db/models/custom-query.entity'
import { HttpError } from '@/models/http-error'
import { isId } from '@/decorators/is-id.decorator'
import { articleToDataItem, filterArticles } from '@/utils/rss-helper'
import json from '@/views/json'
import rss from '@/views/rss'
import atom from '@/views/atom'
import { Data } from '@/interfaces/data'

@AclCrud({
    model: Article,
    config: {
        option: {
            title: '文章管理',
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
            dto: FindArticle,
            decorators: [UseSession()],
        },
        create: false,
        update: false,
        delete: {
            decorators: [UseSession()],
        },
    },
    relations: [],
    order: {
        pubDate: 'DESC',
    },
})
@ApiTags('article')
@Controller('article')
export class ArticleController {
    constructor(
        @InjectRepository(Article) private readonly repository: Repository<Article>,
        @InjectRepository(CustomQuery) private readonly customQueryRepository: Repository<CustomQuery>,
    ) { }

    @ApiResponse({ status: 200, type: Object })
    // @UseAccessToken() , @CurrentUser() user: User
    @Get('custom-query/:id')
    async customQuery(@Param('id') id: number, @Query('key') key: string, @Res() res: Response) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
        }
        const custom = await this.customQueryRepository.findOne({ where: { id, key } })
        if (!custom) {
            throw new HttpError(404, '该 Id 对应的资源不存在！')
        }
        if (key !== custom.key) {
            throw new HttpError(403, '错误的 key，没有权限访问！')
        }
        const { name, format, filter = {}, url } = custom
        const { limit, time } = filter

        const articles = await this.repository.find({
            where: {
                pubDate: time ? MoreThanOrEqual(dayjs().add(-time, 'seconds').toDate()) : undefined,
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
            item: filteredArticles.map((e) => articleToDataItem(e)),
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

