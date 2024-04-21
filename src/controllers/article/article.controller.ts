import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThanOrEqual, Repository } from 'typeorm'
import dayjs from 'dayjs'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Article, FindArticle } from '@/db/models/article.entity'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { CustomQuery } from '@/db/models/custom-query.entity'
import { UseAccessToken } from '@/decorators/use-access-token.decorator'
import { getConditions } from '@/utils/check'
import { HttpError } from '@/models/http-error'
import { isId } from '@/decorators/is-id.decorator'
import { filterArticles } from '@/utils/rss-helper'
// TODO 增加文章转 RSS 功能

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
    async customQuery(@Param('id') id: number, @Query('key') key: string) {
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
        const { format, filter = {} } = custom
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
        return filteredArticles
    }

}

