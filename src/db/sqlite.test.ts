import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import Database from 'better-sqlite3'
import { configureSqliteConnection, formatSqliteWriteError, probeSqliteWritable, SQLITE_WRITE_PROBE_FILE } from './sqlite'

describe('configureSqliteConnection', () => {
    let tempDir: string
    let db: Database.Database

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rss-impact-sqlite-'))
        db = new Database(path.join(tempDir, 'database.sqlite'))
    })

    afterEach(async () => {
        if (db.open) {
            db.close()
        }
        await fs.remove(tempDir)
    })

    it('delete 模式应设置 FULL 同步并校验实际 journal_mode', () => {
        const result = configureSqliteConnection(db, { journalMode: 'delete' })

        expect(result).toEqual({
            journalMode: 'delete',
            synchronous: 'FULL',
            busyTimeout: 10000,
        })
        expect(db.pragma('journal_mode', { simple: true })).toBe('delete')
        expect(db.pragma('synchronous', { simple: true })).toBe(2)
        expect(db.pragma('busy_timeout', { simple: true })).toBe(10000)
    })

    it('wal 模式应设置 NORMAL 同步并支持自定义 busy_timeout', () => {
        const result = configureSqliteConnection(db, { journalMode: 'wal', busyTimeout: 5000 })

        expect(result).toEqual({
            journalMode: 'wal',
            synchronous: 'NORMAL',
            busyTimeout: 5000,
        })
        expect(db.pragma('journal_mode', { simple: true })).toBe('wal')
        expect(db.pragma('synchronous', { simple: true })).toBe(1)
        expect(db.pragma('busy_timeout', { simple: true })).toBe(5000)
    })
})

describe('probeSqliteWritable', () => {
    let tempDir: string

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rss-impact-sqlite-probe-'))
    })

    afterEach(async () => {
        await fs.remove(tempDir)
    })

    it('可写目录应写入成功并清理探测文件', () => {
        const result = probeSqliteWritable(tempDir)

        expect(result.ok).toBe(true)
        expect(fs.pathExistsSync(path.join(tempDir, SQLITE_WRITE_PROBE_FILE))).toBe(false)
        expect(fs.readdirSync(tempDir)).toEqual([])
    })

    it('目录不可创建时应返回错误而不是抛出异常', async () => {
        const file = path.join(tempDir, 'not-a-dir')
        await fs.writeFile(file, 'x')

        const result = probeSqliteWritable(file)

        expect(result.ok).toBe(false)
        expect(result.error?.message).toBeTruthy()
    })
})

describe('formatSqliteWriteError', () => {
    it('应保留原始错误并给出 pwritev2 排查提示', () => {
        const message = formatSqliteWriteError(new Error('disk I/O error'))

        expect(message).toContain('disk I/O error')
        expect(message).toContain('pwritev2')
        expect(message).toContain('sqlite-disk-io-troubleshooting.md')
    })
})
