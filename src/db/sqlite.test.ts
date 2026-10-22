import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import Database from 'better-sqlite3'
import { configureSqliteConnection } from './sqlite'

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
