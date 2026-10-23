import path from 'path'
import fs from 'fs-extra'
import Database from 'better-sqlite3'
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

export const SQLITE_WRITE_PROBE_FILE = '.sqlite-write-probe.sqlite'

export interface SqliteWriteProbeResult {
    ok: boolean
    error?: Error
}

/**
 * 在数据目录执行一次真实写入，用于区分“可读但不可写”的故障。
 *
 * 典型场景：Alpine 3.24 起使用 musl 1.2.6，其 pwrite() 会先调用
 * pwritev2(..., RWF_NOAPPEND)，只有 EOPNOTSUPP / ENOSYS 才会回退到 pwrite。
 * 当宿主 seccomp 拦截 pwritev2（返回 EPERM）时，SQLite 会得到 SQLITE_IOERR_WRITE
 * （即 disk I/O error），而只读查询走 pread 不受影响，表现为“能读不能写”。
 *
 * 探测使用独立文件，避免污染业务库的表结构，结束后会清理。
 */
export function probeSqliteWritable(dir: string): SqliteWriteProbeResult {
    const probePath = path.join(dir, SQLITE_WRITE_PROBE_FILE)
    try {
        fs.ensureDirSync(dir)
        const db = new Database(probePath)
        try {
            db.exec('CREATE TABLE IF NOT EXISTS probe (id INTEGER PRIMARY KEY, value TEXT)')
            db.prepare('INSERT INTO probe (value) VALUES (?)').run(new Date().toISOString())
            db.prepare('DELETE FROM probe').run()
        } finally {
            db.close()
        }
        return { ok: true }
    } catch (error) {
        return { ok: false, error: error as Error }
    } finally {
        for (const suffix of ['', '-journal', '-wal', '-shm']) {
            try {
                fs.removeSync(`${probePath}${suffix}`)
            } catch {
                // 清理失败不影响业务，忽略即可
            }
        }
    }
}

/**
 * 将 SQLite 写入错误转换为可执行的排查提示。
 */
export function formatSqliteWriteError(error?: Error): string {
    const detail = error?.message || '未知错误'
    const lines = [`SQLite 写入探测失败: ${detail}`]
    if (/disk I\/O error|SQLITE_IOERR/i.test(detail)) {
        lines.push(
            '数据库可以读取但无法写入。Alpine 3.24 / musl 1.2.6 的 pwrite() 会先调用 pwritev2(RWF_NOAPPEND)，',
            '宿主 seccomp 拦截 pwritev2（返回 EPERM）时 musl 不会回退，SQLite 由 SQLITE_IOERR_WRITE 报出 disk I/O error。',
            '处理方式：升级宿主 Docker/containerd 到允许 pwritev2 的版本；',
            '或先用 --security-opt seccomp=unconfined 运行以验证是否由 seccomp 引起；',
            '或在确认宿主无法升级时使用 Alpine 3.23（musl 1.2.5）基础镜像。',
        )
    } else {
        lines.push('请检查数据目录（DATA_PATH）是否存在且可写，以及磁盘与 inode 是否耗尽。')
    }
    lines.push('排查步骤见 docs/sqlite-disk-io-troubleshooting.md。')
    return lines.join('\n')
}
