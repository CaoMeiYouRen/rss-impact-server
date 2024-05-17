import path from 'path'
import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './models/user.entity'
import { Feed } from './models/feed.entity'
import { Category } from './models/category.entity'
import { Article } from './models/article.entity'
import { Hook } from './models/hook.entity'
import { Resource } from './models/resource.entiy'
import { WebhookLog } from './models/webhook-log.entity'
import { ProxyConfig } from './models/proxy-config.entity'
import { CustomQuery } from './models/custom-query.entity'
import { __TEST__, DATA_PATH, DATABASE_TYPE } from '@/app.config'

export const DATABASE_DIR = DATA_PATH

export const DATABASE_PATH = __TEST__ ?
    path.join(DATABASE_DIR, 'database.test.sqlite') :
    path.join(DATABASE_DIR, 'database.sqlite')
const entities = [User, Feed, Category, Article, Hook, Resource, WebhookLog, ProxyConfig, CustomQuery]

const repositories = TypeOrmModule.forFeature(entities)
// 支持的数据库类型
const SUPPORTED_DATABASE_TYPES = ['sqlite']

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            async useFactory() {
                if (!SUPPORTED_DATABASE_TYPES.includes(DATABASE_TYPE)) {
                    throw new Error('不支持的数据库类型')
                }
                return {
                    // TODO MySQL 支持
                    // TODO Postgres 支持
                    type: DATABASE_TYPE as any,
                    database: DATABASE_PATH,
                    entities,
                    // eslint-disable-next-line no-sync
                    synchronize: true, // 开发环境固定同步；如果数据库文件不存在，则同步
                    autoLoadEntities: true,
                }
            },
        }),
        repositories,
    ],
    exports: [repositories],
})
export class DatabaseModule { }

