import path from 'path'
import session, { SessionOptions, Store } from 'express-session'
import ms from 'ms'
import ConnectSqlite3 from 'connect-sqlite3'
import RedisStore from 'connect-redis'
import { REDIS_URL, SESSION_SECRET, __DEV__ } from '@/app.config'
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
        secure: true,
        maxAge: ms('30d'),
    },
    store,
}
if (__DEV__) {
    sessionOptions.cookie.secure = false
}

export const sessionMiddleware = session(sessionOptions)
