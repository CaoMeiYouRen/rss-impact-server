import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Article, FindArticle } from '@/db/models/article.entity'

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
    ) { }
}

