import { Store } from 'express-session'
import type { Database } from 'better-sqlite3'

interface BetterSqlite3StoreOptions {
    client: Database
    tableName?: string
    expired?: {
        clear: boolean
        intervalMs: number
    }
}

export class BetterSqlite3Store extends Store {

    private db: Database
    private tableName: string
    private expiredInterval: number
    private clearExpired: boolean
    private timer: NodeJS.Timeout | null = null

    constructor(options: BetterSqlite3StoreOptions) {
        super()
        this.db = options.client
        this.tableName = options.tableName || 'sessions'
        this.clearExpired = options.expired?.clear ?? true
        this.expiredInterval = options.expired?.intervalMs || 900000 // 15 min

        this.initialize()
        if (this.clearExpired) {
            this.startInterval()
        }
    }

    private initialize() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                sid TEXT PRIMARY KEY NOT NULL,
                sess JSON NOT NULL,
                expired DATETIME NOT NULL
            )
        `)
    }

    private startInterval() {
        this.timer = setInterval(() => {
            this.clearExpiredSessions()
        }, this.expiredInterval)
        // Ensure the timer doesn't block the process from exiting
        this.timer.unref()
    }

    private clearExpiredSessions() {
        try {
            const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE expired < ?`)
            stmt.run(Date.now())
        } catch (e) {
            console.error('Failed to clear expired sessions', e)
        }
    }

    get = (sid: string, callback: (err: any, session?: any) => void) => {
        try {
            const stmt = this.db.prepare(`SELECT sess, expired FROM ${this.tableName} WHERE sid = ?`)
            const row = stmt.get(sid) as { sess: string, expired: number } | undefined

            if (!row) {
                return callback(null, null)
            }

            if (row.expired < Date.now()) {
                this.destroy(sid, (err) => callback(err, null))
                return
            }

            const sess = typeof row.sess === 'string' ? JSON.parse(row.sess) : row.sess
            callback(null, sess)
        } catch (err) {
            callback(err)
        }
    }

    set = (sid: string, session: any, callback?: (err?: any) => void) => {
        try {
            const maxAge = session.cookie.maxAge || 86400000 // 1 day default
            const expired = Date.now() + maxAge
            const sess = JSON.stringify(session)

            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO ${this.tableName} (sid, sess, expired)
                VALUES (?, ?, ?)
            `)
            stmt.run(sid, sess, expired)
            callback?.(null)
        } catch (err) {
            callback?.(err)
        }
    }

    destroy = (sid: string, callback?: (err?: any) => void) => {
        try {
            const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE sid = ?`)
            stmt.run(sid)
            callback?.(null)
        } catch (err) {
            callback?.(err)
        }
    }

    touch = (sid: string, session: any, callback?: (err?: any) => void) => {
        try {
            const maxAge = session.cookie.maxAge || 86400000
            const expired = Date.now() + maxAge

            const stmt = this.db.prepare(`UPDATE ${this.tableName} SET expired = ? WHERE sid = ?`)
            stmt.run(expired, sid)
            callback?.(null)
        } catch (err) {
            callback?.(err)
        }
    }

    all = (callback: (err: any, obj?: Record<string, any> | null) => void) => {
        try {
            const stmt = this.db.prepare(`SELECT sid, sess FROM ${this.tableName}`)
            const rows = stmt.all() as { sid: string, sess: string }[]

            const sessions: Record<string, any> = {}
            for (const row of rows) {
                sessions[row.sid] = typeof row.sess === 'string' ? JSON.parse(row.sess) : row.sess
            }
            callback(null, sessions)
        } catch (err) {
            callback(err)
        }
    }

    length = (callback: (err: any, length?: number) => void) => {
        try {
            const stmt = this.db.prepare(`SELECT count(*) as count FROM ${this.tableName}`)
            const row = stmt.get() as { count: number }
            callback(null, row.count)
        } catch (err) {
            callback(err)
        }
    }

    clear = (callback?: (err?: any) => void) => {
        try {
            const stmt = this.db.prepare(`DELETE FROM ${this.tableName}`)
            stmt.run()
            callback?.(null)
        } catch (err) {
            callback?.(err)
        }
    }

}
