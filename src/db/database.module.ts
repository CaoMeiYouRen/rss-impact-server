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
import { ProxyConfig } from './models/proxy-config.entity'
import { CustomQuery } from './models/custom-query.entity'
import { __DEV__, __TEST__, DATA_PATH } from '@/app.config'

export const DATABASE_DIR = DATA_PATH

export const DATABASE_PATH = __TEST__ ?
    path.join(DATABASE_DIR, 'database.test.sqlite') :
    path.join(DATABASE_DIR, 'database.sqlite')
const entities = [User, Feed, Category, Article, Hook, Resource, WebhookLog, ProxyConfig, CustomQuery]

const repositories = TypeOrmModule.forFeature(entities)

// 判断是否同步了
async function isSynchronized() {
    const dir = DATABASE_DIR
    if (!await fs.pathExists(dir)) {
        await fs.mkdir(dir)
    }
    const lockfile = path.join(dir, '.database-lockfile')
    if (await fs.pathExists(lockfile)) {
        return true
    }
    await fs.writeJSON(lockfile, { isSynchronized: true })
    return false
}

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            async useFactory() {
                return {
                    // TODO MySQL 支持
                    // TODO Postgres 支持
                    type: 'sqlite',
                    database: DATABASE_PATH,
                    entities,
                    // eslint-disable-next-line no-sync
                    synchronize: true, // __DEV__ || !await isSynchronized(), // 开发环境固定同步；如果数据库文件不存在，则同步
                    autoLoadEntities: true,
                }
            },
        }),
        repositories,
    ],
    exports: [repositories],
})
export class DatabaseModule { }

