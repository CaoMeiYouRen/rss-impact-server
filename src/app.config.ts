import path from 'path'
import dotenv from 'dotenv'
const modes = [
    '.env.local',
    '.env',
]
const result = dotenv.config({
    path: modes,
})
let envObj: Record<string, string> = {}
if (result.parsed) {
    envObj = Object.assign(result.parsed, envObj)
}

const env = process.env

export const NODE_ENV = env.NODE_ENV

export const __PROD__ = NODE_ENV === 'production'

export const __DEV__ = NODE_ENV === 'development'

export const __TEST__ = NODE_ENV === 'test'

export const __BENCHMARKS_TEST__ = env.BENCHMARKS_TEST === 'true'

export const CI = env.CI

if (__DEV__) {
    console.log('envObj', envObj)
}

export const PORT = Number(env.PORT || 3000)

export const BASE_URL = env.BASE_URL || `http://localhost:${PORT}`
// 时区
export const TZ = env.TZ || 'Asia/Shanghai'

export const TIMEOUT = Number(env.TIMEOUT || 10 * 1000)

// 每页最大查询条数
export const PAGE_LIMIT_MAX = Number(env.PAGE_LIMIT_MAX || 1000)

// mongodb 配置
// export const MONGODB_URL = env.MONGODB_URL
// export const MONGODB_USER = env.MONGODB_USER
// export const MONGODB_PASSWORD = env.MONGODB_PASSWORD

export const SESSION_SECRET = env.SESSION_SECRET

// admin 用户 配置
export const ADMIN_PASSWORD = env.ADMIN_PASSWORD
export const ADMIN_EMAIL = env.ADMIN_EMAIL

export const DATA_PATH = path.resolve(env.DATA_PATH || './data')
export const RESOURCE_DOWNLOAD_PATH = path.resolve(env.RESOURCE_DOWNLOAD_PATH || './data/download')
export const ENABLE_DOWNLOAD_HTTP = env.ENABLE_DOWNLOAD_HTTP === 'true'

// 最大下载并发数
export const DOWNLOAD_LIMIT_MAX = Number(env.DOWNLOAD_LIMIT_MAX || 5)
// 启用注册
export const ENABLE_REGISTER = env.ENABLE_REGISTER === 'true'

// Redis 连接地址
export const REDIS_URL = env.REDIS_URL

export const ARTICLE_SAVE_DAYS = Number(env.ARTICLE_SAVE_DAYS || 90)
export const RESOURCE_SAVE_DAYS = Number(env.RESOURCE_SAVE_DAYS || 30)
export const LOG_SAVE_DAYS = Number(env.LOG_SAVE_DAYS || 30)

export const REVERSE_TRIGGER_LIMIT = Number(env.REVERSE_TRIGGER_LIMIT || 10)

export const HOOK_LIMIT_MAX = Number(env.HOOK_LIMIT_MAX || 10)

export const AI_LIMIT_MAX = Number(env.AI_LIMIT_MAX || 3)

export const BIT_TORRENT_LIMIT_MAX = Number(env.AI_LIMIT_MAX || 5)

export const RSS_LIMIT_MAX = Number(env.RSS_LIMIT_MAX || 5)

export const NOTIFICATION_LIMIT_MAX = Number(env.NOTIFICATION_LIMIT_MAX || 5)

// 路由缓存时间，单位：秒
export const CACHE_EXPIRE = Number(env.CACHE_EXPIRE || 300)

export const DATABASE_TYPE = env.DATABASE_TYPE || 'sqlite'

export const DATABASE_HOST = env.DATABASE_HOST || 'localhost'

export const DATABASE_PORT = Number(env.DATABASE_PORT || 3306)

export const DATABASE_USERNAME = env.DATABASE_USERNAME || 'root'

export const DATABASE_PASSWORD = env.DATABASE_PASSWORD
// 数据库名
export const DATABASE_DATABASE = env.DATABASE_DATABASE || 'rss-impact'

export const DATABASE_CHARSET = env.DATABASE_CHARSET || 'utf8_general_ci'

export const DATABASE_TIMEZONE = env.DATABASE_TIMEZONE || 'local'

export const DATABASE_SCHEMA = env.DATABASE_SCHEMA || 'public'

export const DATABASE_SSL = env.DATABASE_SSL === 'true'

export const DATABASE_INDEX_LENGTH = Number(env.DATABASE_INDEX_LENGTH || 1024)

export const SESSION_MAX_AGE = env.SESSION_MAX_AGE

export const ENABLE_ORIGIN_LIST = env.ENABLE_ORIGIN_LIST?.split(',')?.map((e) => e?.trim())?.filter(Boolean)

export const ARTICLE_LIMIT_MAX = Number(env.ARTICLE_LIMIT_MAX || 1000)

export const DEFAULT_FEED_CRON = env.DEFAULT_FEED_CRON || 'EVERY_10_MINUTES'

export const SENTRY_DSN = env.SENTRY_DSN || ''
