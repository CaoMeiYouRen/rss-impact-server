import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Article, FindArticle } from '@/db/models/article.entity'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { DicData } from '@/models/avue.dto'
import { getConditions } from '@/utils/check'

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

    @ApiResponse({ status: 200, type: [DicData] })
    @Get('typeDicData')
    async typeDicData(@CurrentUser() user: User) {
        const conditions = getConditions(user)
        const data = await this.repository
            .createQueryBuilder('article')
            .where({
                ...conditions,
            })
            .select('enclosureType', 'type')// 选择要 distinct 的列
            .distinct(true) // 启用 distinct
            .getRawMany() as { type: string }[]
        return data.filter((e) => e.type).map((e) => ({
            label: e.type,
            value: e.type,
        }))
    }
}

