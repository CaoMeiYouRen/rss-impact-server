import { Body, Controller, Delete, Logger, Param, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UseSession } from '@/decorators/use-session.decorator'
import { CreateFeed, Feed, FindFeed, UpdateFeed } from '@/db/models/feed.entity'
import { AclCrud } from '@/decorators/acl-crud.decorator'
import { User } from '@/db/models/user.entity'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { HttpError } from '@/models/http-error'
import { checkAuth } from '@/utils/check'
import { TasksService } from '@/services/tasks/tasks.service'
import { isId } from '@/decorators/is-id.decorator'

@UseSession()
@AclCrud({
    model: Feed,
    config: {
        option: {
            title: '订阅管理',
            column: [],
        },
    },
    routes: {
        find: {
            dto: FindFeed,
        },
        create: {
            dto: CreateFeed,
        },
        update: {
            dto: UpdateFeed,
        },
    },
    relations: ['hooks'],
    props: {
        label: 'title',
        value: 'id',
    },
})
@ApiTags('feed')
@Controller('feed')
export class FeedController {

    private readonly logger = new Logger(FeedController.name)

    constructor(@InjectRepository(Feed) private readonly repository: Repository<Feed>,
        private readonly tasksService: TasksService,
    ) {
    }

    @ApiResponse({ status: 201, type: CreateFeed })
    @ApiOperation({ summary: '创建记录' })
    @Post('')
    async create(@Body() body: CreateFeed, @CurrentUser() user: User) {
        this.logger.debug(JSON.stringify(body, null, 4))

        delete body.user  // 以 userId 字段为准
        body.userId = user.id  // 以 userId 字段为准

        const newDocument = await this.repository.save(this.repository.create(body))
        if (newDocument.isEnabled) {
            await this.tasksService.enableFeedTask(newDocument, true)
        }
        return newDocument
    }

    @ApiResponse({ status: 200, type: UpdateFeed })
    @ApiOperation({ summary: '更新记录' })
    @Put('')
    async update(@Body() body: UpdateFeed, @CurrentUser() user: User) {
        this.logger.debug(JSON.stringify(body, null, 4))
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
        const updatedDocument = await this.repository.save(this.repository.create(body)) // 使用 save 解决多对多的情况下保存的问题
        if (updatedDocument.isEnabled) {
            await this.tasksService.enableFeedTask(updatedDocument, true)
        } else {
            await this.tasksService.disableFeedTask(updatedDocument, true)
        }
        return updatedDocument
    }

    @ApiResponse({ status: 200, type: Feed })
    @ApiOperation({ summary: '删除记录' })
    @Delete(':id')
    async delete(@Param('id') id: number, @CurrentUser() user: User) {
        if (!isId(id)) {
            throw new HttpError(400, '无效的 Id！')
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
        await this.repository.delete(id)
        await this.tasksService.disableFeedTask(document, true)
        return document
    }
}
