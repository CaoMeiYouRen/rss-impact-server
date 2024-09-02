import path from 'path'
import { Global, Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import ms from 'ms'
import { User } from './models/user.entity'
import { Feed } from './models/feed.entity'
import { Category } from './models/category.entity'
import { Article } from './models/article.entity'
import { Hook } from './models/hook.entity'
import { Resource } from './models/resource.entiy'
import { WebhookLog } from './models/webhook-log.entity'
import { ProxyConfig } from './models/proxy-config.entity'
import { CustomQuery } from './models/custom-query.entity'
import { DailyCount } from './models/daily-count.entity'
import { __TEST__, DATA_PATH, DATABASE_CHARSET, DATABASE_DATABASE, DATABASE_HOST, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_SCHEMA, DATABASE_TIMEZONE, DATABASE_TYPE, DATABASE_USERNAME } from '@/app.config'

export const DATABASE_DIR = DATA_PATH

export const DATABASE_PATH = __TEST__ ?
    path.join(DATABASE_DIR, 'database.test.sqlite') :
    path.join(DATABASE_DIR, 'database.sqlite')
export const entities = [User, Feed, Category, Article, Hook, Resource, WebhookLog, ProxyConfig, CustomQuery, DailyCount]

const repositories = TypeOrmModule.forFeature(entities)
// 支持的数据库类型
const SUPPORTED_DATABASE_TYPES = ['sqlite', 'mysql', 'postgres']

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            async useFactory() {
                if (!SUPPORTED_DATABASE_TYPES.includes(DATABASE_TYPE)) {
                    throw new Error('不支持的数据库类型')
                }
                let options: TypeOrmModuleOptions = {}
                switch (DATABASE_TYPE) {
                    case 'sqlite':
                        options = { database: DATABASE_PATH } //  数据库路径。
                        break
                    case 'mysql':
                        options = {
                            host: DATABASE_HOST,
                            port: DATABASE_PORT,
                            username: DATABASE_USERNAME,
                            password: DATABASE_PASSWORD,
                            database: DATABASE_DATABASE,
                            charset: DATABASE_CHARSET, // 连接的字符集。
                            timezone: DATABASE_TIMEZONE,
                            connectTimeout: ms('60 s'), // 在连接到 MySQL 服务器期间发生超时之前的毫秒数
                            // debug: __DEV__,
                            supportBigNumbers: true, // 处理数据库中的大数字
                            bigNumberStrings: false, // 仅当它们无法用 JavaScript Number 对象准确表示时才会返回大数字作为 String 对象
                        }
                        break
                    case 'postgres':
                        options = {
                            host: DATABASE_HOST,
                            port: DATABASE_PORT,
                            username: DATABASE_USERNAME,
                            password: DATABASE_PASSWORD,
                            database: DATABASE_DATABASE,
                            schema: DATABASE_SCHEMA,
                        }
                        break
                    default:
                        break
                }
                return {
                    ...options,
                    type: DATABASE_TYPE as any,
                    entities,
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

