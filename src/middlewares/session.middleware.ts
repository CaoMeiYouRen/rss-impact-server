import path from 'path'
import session, { SessionOptions, Store } from 'express-session'
import ms from 'ms'
import ConnectSqlite3 from 'connect-sqlite3'
import { SESSION_SECRET, __DEV__ } from '@/app.config'
import { DATABASE_PATH } from '@/db/database.module'

const SQLiteStore = ConnectSqlite3(session)

const sessionOptions: SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: ms('30d'),
    },
    // TODO redis store 支持
    store: new SQLiteStore({
        dir: path.dirname(DATABASE_PATH),
        db: path.basename(DATABASE_PATH),
    }) as Store,
}
if (__DEV__) {
    sessionOptions.cookie.secure = false
}

export const sessionMiddleware = session(sessionOptions)
