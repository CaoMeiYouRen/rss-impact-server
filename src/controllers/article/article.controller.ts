import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Article, CreateArticle, FindArticle, UpdateArticle } from '@/db/models/article.entity'

@UseSession()
@AclCrud({
    model: Article,
    config: {
        option: {
            title: '文章管理',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindArticle,
        },
        create: {
            dto: CreateArticle,
        },
        update: {
            dto: UpdateArticle,
        },
    },
    // relations: ['feed'],
    order: {
        publishDate: 'DESC',
    },
})
@ApiTags('article')
@Controller('article')
export class ArticleController {
    constructor(@InjectRepository(Article) private readonly repository: Repository<Article>) { }
}

