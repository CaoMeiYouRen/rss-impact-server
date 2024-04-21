import path from 'path'
import dotenv from 'dotenv'
const modes = [
    '.env.local',
    '.env',
]
let envObj: Record<string, string> = {}
for (let i = 0; i < modes.length; i++) {
    const mode = modes[i]
    const result = dotenv.config({ path: mode })
    if (result.parsed) {
        envObj = Object.assign(result.parsed, envObj)
    }
}
const env = process.env

export const NODE_ENV = env.NODE_ENV

export const __DEV__ = NODE_ENV === 'development'

export const __TEST__ = NODE_ENV === 'test'

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
