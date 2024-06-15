import { Body, Controller, Logger, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { Category, CreateCategory, FindCategory, UpdateCategory } from '@/db/models/category.entity'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { HttpError } from '@/models/http-error'
import { checkAuth } from '@/utils/check'
import { __DEV__ } from '@/app.config'

@UseSession()
@AclCrud({
    model: Category,
    config: {
        option: {
            title: '分类管理',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindCategory,
        },
        create: {
            dto: CreateCategory,
        },
        update: {
            dto: UpdateCategory,
        },
    },
    props: {
        label: 'name',
        value: 'id',
    },
    relations: ['feeds'],
})
@ApiTags('category')
@Controller('category')
export class CategoryController {

    private readonly logger = new Logger(CategoryController.name)

    constructor(@InjectRepository(Category) private readonly repository: Repository<Category>) {
    }

    @ApiResponse({ status: 201, type: Category })
    @ApiOperation({ summary: '创建记录' })
    @Post('')
    async create(@Body() body: CreateCategory, @CurrentUser() user: User) {
        __DEV__ && this.logger.debug(JSON.stringify(body, null, 4))
        const userId = user.id
        const { name } = body
        if (await this.repository.count({ where: { name, userId } })) {
            throw new HttpError(400, '已存在相同名称的分类！')
        }
        delete body.user  // 以 userId 字段为准
        body.userId = user.id  // 以 userId 字段为准

        const category = await this.repository.save(this.repository.create(body))

        return category
    }

    @ApiResponse({ status: 200, type: Category })
    @ApiOperation({ summary: '更新记录' })
    @Put('')
    async update(@Body() body: UpdateCategory, @CurrentUser() user: User) {
        __DEV__ && this.logger.debug(JSON.stringify(body, null, 4))
        const id = body.id
        delete body.user  // 以 userId 字段为准
        if (!body.userId) {
            body.userId = user.id
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
        const { name } = body
        const oldCategory = await this.repository.findOne({
            where: {
                name,
                userId,
            },
        })
        if (oldCategory && oldCategory.id !== id) {
            throw new HttpError(400, '已存在相同名称的分类！')
        }
        const updatedDocument = await this.repository.save(this.repository.create(body)) // 使用 save 解决多对多的情况下保存的问题
        return updatedDocument
    }
}
