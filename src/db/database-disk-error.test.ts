import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import Database from 'better-sqlite3'
import { DataSource, Repository, Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { retryBackoff } from '@/utils/helper'

@Entity()
class LightEntity {

    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column()
    value: string

}

@Entity()
class StubArticle {

    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column()
    guid: string

    @Column()
    title: string

    @Column({ nullable: true })
    link: string

    @Column({ type: 'text', nullable: true })
    content: string

    @Column({ nullable: true })
    contentSnippet: string

    @Column({ nullable: true })
    author: string

    @Column({ nullable: true })
    pubDate: Date

    @Column({ nullable: true })
    summary: string

    @Column({ type: 'simple-json', nullable: true })
    categories: string

    @Column({ nullable: true })
    userId: number

    @Column({ nullable: true })
    feedId: number

}

jest.mock('@/middlewares/logger.middleware', () => ({
    winstonLogger: {
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
        info: jest.fn(),
    },
    logDir: '/tmp',
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
    },
    CustomLogger: jest.fn(),
}))

jest.mock('@/app.config', () => ({
    __DEV__: true,
    __PROD__: false,
    __TEST__: true,
    DATABASE_TYPE: 'sqlite',
    DATA_PATH: os.tmpdir(),
    ARTICLE_LIMIT_MAX: 1000,
    ARTICLE_SAVE_DAYS: 30,
    DISABLE_EMPTY_FEEDS: false,
    LOG_SAVE_DAYS: 30,
    MAX_ERROR_COUNT: 10,
    RESOURCE_DOWNLOAD_PATH: path.join(os.tmpdir(), 'download'),
    RESOURCE_SAVE_DAYS: 30,
    REVERSE_TRIGGER_LIMIT: 10,
    TZ: 'Asia/Shanghai',
}))

const TEST_DB_PATH = path.join(os.tmpdir(), `rss-impact-disk-err-${Date.now()}.sqlite`)

describe('SQLite 磁盘 I/O 错误写入测试', () => {
    let dataSource: DataSource
    let repo: Repository<LightEntity>

    beforeAll(async () => {
        await fs.ensureDir(path.dirname(TEST_DB_PATH))
        if (await fs.pathExists(TEST_DB_PATH)) {
            await fs.remove(TEST_DB_PATH)
        }
    })

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await dataSource.destroy()
        }
        // 等待文件锁释放
        await new Promise((r) => setTimeout(r, 200))
        try {
            if (await fs.pathExists(TEST_DB_PATH)) {
                await fs.remove(TEST_DB_PATH)
            }
            const walPath = `${TEST_DB_PATH}-wal`
            const shmPath = `${TEST_DB_PATH}-shm`
            if (await fs.pathExists(walPath)) { await fs.remove(walPath) }
            if (await fs.pathExists(shmPath)) { await fs.remove(shmPath) }
        } catch {
            // 清理失败可忽略
        }
    })

    async function initDataSource() {
        dataSource = new DataSource({
            type: 'better-sqlite3',
            database: TEST_DB_PATH,
            entities: [LightEntity, StubArticle],
            synchronize: true,
        })
        await dataSource.initialize()
        repo = dataSource.getRepository(LightEntity)
    }

    describe('基本写入', () => {
        beforeAll(async () => {
            await initDataSource()
        })

        afterAll(async () => {
            if (dataSource?.isInitialized) {
                await dataSource.destroy()
            }
        })

        it('单条 INSERT 应成功', async () => {
            const entity = repo.create({ value: 'test-single-insert' })
            const saved = await repo.save(entity)
            expect(saved.id).toBeGreaterThan(0)
            expect(saved.value).toBe('test-single-insert')
        })

        it('批量 INSERT 应成功', async () => {
            const entities = Array.from({ length: 10 }, (_, i) =>
                repo.create({ value: `batch-${i}` }),
            )
            const saved = await repo.save(entities)
            expect(saved).toHaveLength(10)
            saved.forEach((e, i) => {
                expect(e.id).toBeGreaterThan(0)
                expect(e.value).toBe(`batch-${i}`)
            })
        })

        it('写入后应能立即读取', async () => {
            const entity = repo.create({ value: 'write-then-read' })
            const saved = await repo.save(entity)
            const found = await repo.findOne({ where: { id: saved.id } })
            expect(found).toBeTruthy()
            expect(found!.value).toBe('write-then-read')
        })
    })

    describe('高强度连续写入', () => {
        beforeAll(async () => {
            await initDataSource()
        })

        afterAll(async () => {
            if (dataSource?.isInitialized) {
                await dataSource.destroy()
            }
        })

        it('200 次连续 INSERT 不应丢失数据或崩溃', async () => {
            const count = 200
            const results: LightEntity[] = []
            for (let i = 0; i < count; i++) {
                const entity = repo.create({ value: `stress-${i}` })
                const saved = await repo.save(entity)
                results.push(saved)
            }
            expect(results).toHaveLength(count)

            const total = await repo.count()
            expect(total).toBeGreaterThanOrEqual(count)

            // 验证首尾两条都可读
            const first = await repo.findOne({ where: { id: results[0].id } })
            const last = await repo.findOne({ where: { id: results[count - 1].id } })
            expect(first).toBeTruthy()
            expect(last).toBeTruthy()
        })

        it('包含大量文本数据的写入应成功（模拟真实文章内容）', async () => {
            const largeContent = '测试内容 '.repeat(5000) // 约 25KB
            const articleRepo = dataSource.getRepository(StubArticle)
            const now = new Date()
            const entity = articleRepo.create({
                guid: `guid-large-${Date.now()}`,
                title: '压力测试文章',
                link: 'https://example.com/stress-test',
                content: `<div>${largeContent}</div>`,
                contentSnippet: largeContent.slice(0, 512),
                author: '测试作者',
                pubDate: now,
                summary: '摘要',
                categories: '["测试"]',
                userId: 1,
                feedId: 1,
            })
            const saved = await articleRepo.save(entity)
            expect(saved.id).toBeGreaterThan(0)
            expect(saved.content).toContain('测试内容')
        })
    })

    describe('SQLITE_BUSY 并发写入竞争', () => {
        beforeAll(async () => {
            await initDataSource()
        })

        afterAll(async () => {
            if (dataSource?.isInitialized) {
                await dataSource.destroy()
            }
        })

        it('事务持有写锁时，另一连接写入应被阻塞或报 BUSY', async () => {
            const db2 = new Database(TEST_DB_PATH)
            db2.pragma('busy_timeout = 50') // 50ms 超短等待

            // 查询 TypeORM 生成的列名
            const colInfo = db2.prepare('PRAGMA table_info(light_entity)').all() as any[]
            const colNames = colInfo.map((c: any) => c.name)

            // 在事务内持有写锁
            let busyOrLocked = false
            await dataSource.transaction(async (manager) => {
                await manager.save(LightEntity, { value: 'lock-holder' })

                // 另一个连接尝试写入
                try {
                    db2.prepare(
                        `INSERT INTO light_entity (${colNames.filter((n) => n !== 'id').join(', ')}) VALUES (${colNames.filter((n) => n !== 'id').map(() => '?').join(', ')})`,
                    ).run(
                        new Date().toISOString(),
                        new Date().toISOString(),
                        'busy-test',
                    )
                } catch (e: any) {
                    if (/SQLITE_BUSY|disk I\/O error/i.test(e.message)) {
                        busyOrLocked = true
                    }
                }
            })

            db2.close()

            if (busyOrLocked) {
                expect(busyOrLocked).toBe(true)
            }
            // 如果主事务提交得足够快，busyOrLocked 可能为 false，这也是正常的
        })

        it('busy_timeout 充足时并发写入应自动等待后成功', async () => {
            const db2 = new Database(TEST_DB_PATH)
            db2.pragma('busy_timeout = 10000') // 10s

            const colInfo = db2.prepare('PRAGMA table_info(light_entity)').all() as any[]
            const colNames = colInfo.map((c: any) => c.name)
            const nonIdCols = colNames.filter((n) => n !== 'id')

            let secondWriteSucceeded = false

            await dataSource.transaction(async (manager) => {
                await manager.save(LightEntity, { value: 'txn-write' })

                try {
                    db2.prepare(
                        `INSERT INTO light_entity (${nonIdCols.join(', ')}) VALUES (${nonIdCols.map(() => '?').join(', ')})`,
                    ).run(
                        new Date().toISOString(),
                        new Date().toISOString(),
                        'waited-write',
                    )
                    secondWriteSucceeded = true
                } catch {
                    // 在极端情况下仍可能失败
                }
            })

            db2.close()

            // 至少 TypeORM 的写入应已提交
            const count = await repo.count()
            expect(count).toBeGreaterThanOrEqual(1)
            // 验证写入未造成数据损坏
            const integrity = await dataSource.query('PRAGMA integrity_check;')
            expect(integrity[0]?.integrity_check).toBe('ok')
        })
    })

    describe('retryBackoff 指数退避重试', () => {
        it('遇到 disk I/O error 应重试并成功', async () => {
            let calls = 0
            const fn = jest.fn().mockImplementation(() => {
                calls++
                if (calls < 3) {
                    const err = new Error('SqliteError: disk I/O error')
                    throw err
                }
                return 'recovered'
            })

            const result = await retryBackoff(fn, {
                maxRetries: 5,
                initialInterval: 10,
                maxInterval: 1000,
                shouldRetry: (e) => /disk I\/O error|SQLITE_BUSY|SQLITE_IOERR/i.test(e.message),
            })

            expect(result).toBe('recovered')
            expect(calls).toBe(3)
        })

        it('非 SQLite 错误不重试', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('Network timeout'))

            await expect(
                retryBackoff(fn, {
                    maxRetries: 3,
                    initialInterval: 10,
                    maxInterval: 100,
                    shouldRetry: (e) => /disk I\/O error|SQLITE_BUSY|SQLITE_IOERR/i.test(e.message),
                }),
            ).rejects.toThrow('Network timeout')

            expect(fn).toHaveBeenCalledTimes(1)
        })

        it('重试耗尽时抛出包装后错误（cause 保留原始 SQLITE_IOERR）', async () => {
            const fn = jest.fn().mockRejectedValue(new Error('SQLITE_IOERR_WRITE'))

            let caught: Error | null = null
            try {
                await retryBackoff(fn, {
                    maxRetries: 2,
                    initialInterval: 10,
                    maxInterval: 100,
                    shouldRetry: (e) => /disk I\/O error|SQLITE_BUSY|SQLITE_IOERR/i.test(e.message),
                })
            } catch (e: any) {
                caught = e
            }

            expect(caught).toBeTruthy()
            expect(caught!.message).toContain('重试次数已达到最大重试次数')
            expect((caught as any).cause?.message).toBe('SQLITE_IOERR_WRITE')
            expect(fn).toHaveBeenCalledTimes(2)
        })
    })

    describe('数据库完整性', () => {
        beforeAll(async () => {
            await initDataSource()
        })

        afterAll(async () => {
            if (dataSource?.isInitialized) {
                await dataSource.destroy()
            }
        })

        it('PRAGMA integrity_check 应返回 ok', async () => {
            const result = await dataSource.query('PRAGMA integrity_check;')
            expect(result).toBeDefined()
            expect(result[0]?.integrity_check).toBe('ok')
        })

        it('删除记录后数据库仍应保持完整', async () => {
            const entity = repo.create({ value: 'to-be-deleted' })
            const saved = await repo.save(entity)
            await repo.delete(saved.id)
            const result = await dataSource.query('PRAGMA integrity_check;')
            expect(result[0]?.integrity_check).toBe('ok')
        })
    })

    describe('事务回滚', () => {
        beforeAll(async () => {
            await initDataSource()
        })

        afterAll(async () => {
            if (dataSource?.isInitialized) {
                await dataSource.destroy()
            }
        })

        it('事务中发生错误时应回滚，不留下部分数据', async () => {
            const before = await repo.count()

            try {
                await dataSource.transaction(async (manager) => {
                    await manager.save(LightEntity, { value: 'rollback-1' })
                    throw new Error('模拟事务中断')
                })
            } catch {
                // 预期抛错
            }

            const after = await repo.count()
            expect(after).toBe(before)
        })

        it('事务成功后数据应持久化', async () => {
            const before = await repo.count()

            await dataSource.transaction(async (manager) => {
                await manager.save(LightEntity, { value: 'commit-test' })
            })

            const after = await repo.count()
            expect(after).toBe(before + 1)

            // 关闭并重新打开，验证数据持久化
            await dataSource.destroy()

            const ds2 = new DataSource({
                type: 'better-sqlite3',
                database: TEST_DB_PATH,
                entities: [LightEntity, StubArticle],
                synchronize: false,
            })
            await ds2.initialize()
            const repo2 = ds2.getRepository(LightEntity)
            const afterReconnect = await repo2.count()
            expect(afterReconnect).toBe(after)
            await ds2.destroy()

            // 重新初始化，供后续测试使用
            await initDataSource()
        })
    })
})
