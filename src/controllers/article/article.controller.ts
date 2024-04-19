import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Article, FindArticle } from '@/db/models/article.entity'
// TODO 增加文章转 RSS 功能
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
        create: false,
        update: false,
        // create: {
        //     dto: CreateArticle,
        // },
        // update: {
        //     dto: UpdateArticle,
        // },
    },
    relations: [],
    order: {
        pubDate: 'DESC',
    },
})
@ApiTags('article')
@Controller('article')
export class ArticleController {
    constructor(@InjectRepository(Article) private readonly repository: Repository<Article>) { }
}

