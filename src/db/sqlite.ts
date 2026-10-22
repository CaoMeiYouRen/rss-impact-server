import { DATABASE_JOURNAL_MODE, DatabaseJournalMode } from '@/app.config'

export interface SqliteConnection {
    pragma: (sql: string, options?: { simple?: boolean }) => unknown
}

export interface SqlitePragmaResult {
    journalMode: DatabaseJournalMode
    synchronous: 'NORMAL' | 'FULL'
    busyTimeout: number
}

/**
 * 统一配置 better-sqlite3 连接的 PRAGMA。
 *
 * 必须先设置 busy_timeout：切换 journal_mode 可能需要等待其他连接的锁，
 * 否则在并发启动时会直接失败。
 */
export function configureSqliteConnection(
    db: SqliteConnection,
    options: { journalMode?: DatabaseJournalMode, busyTimeout?: number } = {},
): SqlitePragmaResult {
    const journalMode = options.journalMode ?? DATABASE_JOURNAL_MODE
    const busyTimeout = options.busyTimeout ?? 10000

    db.pragma(`busy_timeout = ${busyTimeout}`)

    const actualJournalMode = String(db.pragma(`journal_mode = ${journalMode}`, { simple: true })).toLowerCase()
    if (actualJournalMode !== journalMode) {
        throw new Error(`SQLite journal_mode 设置失败：期望 ${journalMode}，实际 ${actualJournalMode}`)
    }

    // DELETE 模式使用回滚日志，FULL 保证每次提交都落盘；
    // WAL 模式下 NORMAL 已足够安全，且避免频繁 fsync。
    const synchronous = journalMode === 'wal' ? 'NORMAL' : 'FULL'
    db.pragma(`synchronous = ${synchronous}`)

    return {
        journalMode,
        synchronous,
        busyTimeout,
    }
}
