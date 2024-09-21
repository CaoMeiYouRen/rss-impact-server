import path from 'path'
import { Global, Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import ms from 'ms'
import fs from 'fs-extra'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions'
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
import { __DEV__, __TEST__, DATA_PATH, DATABASE_CHARSET, DATABASE_DATABASE, DATABASE_HOST, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_SCHEMA, DATABASE_SSL, DATABASE_TIMEZONE, DATABASE_TYPE, DATABASE_USERNAME } from '@/app.config'
import { CustomLogger, winstonLogger } from '@/middlewares/logger.middleware'

export const DATABASE_DIR = DATA_PATH

export const DATABASE_PATH = __TEST__ ?
    path.join(DATABASE_DIR, 'database.test.sqlite') :
    path.join(DATABASE_DIR, 'database.sqlite')
export const entities = [User, Feed, Category, Article, Hook, Resource, WebhookLog, ProxyConfig, CustomQuery, DailyCount]

const lockFilePath = path.join(DATABASE_DIR, 'database.lock.json')

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
                // 是否在每次应用程序启动时自动创建数据库架构。
                let synchronize: boolean = false
                switch (DATABASE_TYPE) {
                    case 'sqlite': {
                        options = { database: DATABASE_PATH } as SqliteConnectionOptions //  数据库路径。
                        synchronize = true // 在数据库为 sqlite 的时候固定同步
                        break
                    }
                    case 'mysql': {
                        options = {
                            host: DATABASE_HOST,
                            port: DATABASE_PORT,
                            username: DATABASE_USERNAME,
                            password: DATABASE_PASSWORD,
                            database: DATABASE_DATABASE,
                            charset: DATABASE_CHARSET, // 连接的字符集。
                            timezone: DATABASE_TIMEZONE,
                            connectTimeout: ms('120 s'), // 在连接到 MySQL 服务器期间发生超时之前的毫秒数
                            // debug: __DEV__,
                            supportBigNumbers: true, // 处理数据库中的大数字
                            bigNumberStrings: false, // 仅当它们无法用 JavaScript Number 对象准确表示时才会返回大数字作为 String 对象
                            ssl: DATABASE_SSL ? {
                                rejectUnauthorized: false,
                            } : undefined,
                        } as MysqlConnectionOptions
                        // mysql 仅在第一次加载时同步，否则会丢失数据
                        if (!await fs.pathExists(lockFilePath)) {
                            synchronize = true
                            await fs.writeJSON(lockFilePath, { synchronize: false })
                        }
                        if (__DEV__) { // 开发环境下固定同步
                            synchronize = true
                        }
                        break
                    }
                    case 'postgres': {
                        options = {
                            host: DATABASE_HOST,
                            port: DATABASE_PORT,
                            username: DATABASE_USERNAME,
                            password: DATABASE_PASSWORD,
                            database: DATABASE_DATABASE,
                            schema: DATABASE_SCHEMA,
                            parseInt8: true, // 解析 int8 到 number
                            ssl: DATABASE_SSL,
                            connectTimeoutMS: ms('120 s'), // 在连接到 postgres 服务器期间发生超时之前的毫秒数
                            // logNotifications: __DEV__,
                        } as PostgresConnectionOptions
                        // postgres 仅在第一次加载时同步，否则会丢失数据
                        if (!await fs.pathExists(lockFilePath)) {
                            synchronize = true
                            await fs.writeJSON(lockFilePath, { synchronize: false })
                        }
                        if (__DEV__) { // 开发环境下固定同步
                            synchronize = true
                        }
                        break
                    }
                    default:
                        break
                }
                return {
                    ...options,
                    // logging: __DEV__ || ['error', 'warn'], // 是否启用日志记录
                    logger: new CustomLogger(winstonLogger),
                    // loggerLevel: __DEV__ ? 'debug' : 'warn',
                    maxQueryExecutionTime: 3000, // 记录耗时长的查询
                    type: DATABASE_TYPE as any,
                    entities,
                    synchronize,
                    autoLoadEntities: true,
                }
            },
        }),
        repositories,
    ],
    exports: [repositories],
})
export class DatabaseModule { }

