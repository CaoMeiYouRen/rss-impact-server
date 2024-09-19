import path from 'path'
import session, { SessionOptions, Store } from 'express-session'
import ms from 'ms'
import ConnectSqlite3 from 'connect-sqlite3'
import RedisStore from 'connect-redis'
import { ENABLE_ORIGIN_LIST, REDIS_URL, SESSION_MAX_AGE, SESSION_SECRET, __PROD__ } from '@/app.config'
import { DATABASE_PATH } from '@/db/database.module'
import { getRedisClient } from '@/utils/redis'
let store: Store

if (REDIS_URL) {
    const client = getRedisClient()
    store = new RedisStore({
        client,
        prefix: 'rss-impact:',
    })
} else {
    const SQLiteStore = ConnectSqlite3(session)
    store = new SQLiteStore({
        dir: path.dirname(DATABASE_PATH),
        db: path.basename(DATABASE_PATH),
    }) as Store
}
// TODO 考虑增加 session 管理
const sessionOptions: SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: ms(SESSION_MAX_AGE),
        httpOnly: true,
        sameSite: 'lax',
    },
    store,
}

if (__PROD__) {
    // 如果需要跨域，判断是否为 http，如果是，则设置为 false
    // 参考 https://github.com/CaoMeiYouRen/rss-impact-server/issues/334
    if (ENABLE_ORIGIN_LIST?.length) {
        sessionOptions.cookie.secure = !ENABLE_ORIGIN_LIST.some((e) => e.startsWith('http://'))
        if (sessionOptions.cookie.secure) { // 仅在 secure 的时候 sameSite 允许设置为 none
            sessionOptions.cookie.sameSite = 'none'
        }
    } else {
        sessionOptions.cookie.secure = true
    }
}

export const sessionMiddleware = session(sessionOptions)
