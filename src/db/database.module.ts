import path from 'path'
import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import fs from 'fs-extra'
import { User } from './models/user.entity'
import { Feed } from './models/feed.entity'
import { Category } from './models/category.entity'
import { Article } from './models/article.entity'
import { Hook } from './models/hook.entity'
import { Resource } from './models/resource.entiy'
import { WebhookLog } from './models/webhook-log.entity'
import { __DEV__ } from '@/app.config'

export const DATABASE_PATH = path.join(__dirname, '../../data/database.sqlite')

const entities = [User, Feed, Category, Article, Hook, Resource, WebhookLog]

const repositories = TypeOrmModule.forFeature(entities)

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            async useFactory() {
                return {
                    // TODO mysql 支持
                    type: 'sqlite',
                    database: DATABASE_PATH,
                    entities,
                    // eslint-disable-next-line no-sync
                    synchronize: __DEV__ || !await fs.pathExists(DATABASE_PATH), // 开发环境固定同步；如果数据库文件不存在，则同步
                    autoLoadEntities: true,
                }
            },
        }),
        repositories,
    ],
    exports: [repositories],
})
export class DatabaseModule { }
