import { readFileSync } from 'fs'
import { resolve } from 'path'

const workspacePath = resolve(__dirname, '../../pnpm-workspace.yaml')
const lockfilePath = resolve(__dirname, '../../pnpm-lock.yaml')

describe('OpenTelemetry 依赖基线', () => {
    it('pnpm-workspace.yaml 不应再把 @sentry/node 固定到 8.x', () => {
        const workspaceContent = readFileSync(workspacePath, 'utf8')
        // @sentry/node 8.x 会引入 OTel 1.x，与 @sentry/nestjs 11.x 不匹配
        expect(workspaceContent).not.toMatch(/"@sentry\/node":\s*\^?8\./)
    })

    it('lockfile 不应再包含 OTel 1.x 运行时', () => {
        const lockfileContent = readFileSync(lockfilePath, 'utf8')
        expect(lockfileContent).not.toMatch(/@opentelemetry\/core@1\./)
        expect(lockfileContent).not.toMatch(/@opentelemetry\/sdk-trace-base@1\./)
        expect(lockfileContent).not.toMatch(/@sentry\/node@8\./)
    })
})

describe('SQLite journal mode 配置', () => {
    const sessionMiddlewarePath = resolve(__dirname, '../middlewares/session.middleware.ts')
    const dbModulePath = resolve(__dirname, '../db/database.module.ts')
    const sqliteHelperPath = resolve(__dirname, '../db/sqlite.ts')
    const appConfigPath = resolve(__dirname, '../app.config.ts')
    const packageJsonPath = resolve(__dirname, '../../package.json')

    describe('session.middleware.ts', () => {
        it('应复用统一的 SQLite PRAGMA 配置，而不是自行硬编码 journal_mode', () => {
            const content = readFileSync(sessionMiddlewarePath, 'utf8')
            expect(content).toMatch(/configureSqliteConnection/)
            expect(content).not.toMatch(/pragma\(['"]journal_mode/)
        })
    })

    describe('database.module.ts', () => {
        it('SqlitePragmaService 应复用统一的 SQLite PRAGMA 配置', () => {
            const content = readFileSync(dbModulePath, 'utf8')
            expect(content).toMatch(/configureSqliteConnection/)
        })
    })

    describe('sqlite.ts', () => {
        it('应先设置 busy_timeout，再切换 journal_mode 并校验实际结果', () => {
            const content = readFileSync(sqliteHelperPath, 'utf8')
            const busyTimeoutIndex = content.indexOf('busy_timeout = ')
            const journalModeIndex = content.indexOf('journal_mode = ')
            expect(busyTimeoutIndex).toBeGreaterThan(-1)
            expect(journalModeIndex).toBeGreaterThan(busyTimeoutIndex)
            expect(content).toMatch(/actualJournalMode !== journalMode/)
        })

        it('DELETE 模式应使用 FULL，WAL 模式应使用 NORMAL', () => {
            const content = readFileSync(sqliteHelperPath, 'utf8')
            expect(content).toMatch(/journalMode === 'wal' \? 'NORMAL' : 'FULL'/)
        })
    })

    describe('app.config.ts', () => {
        it('默认使用兼容性更好的 delete，并允许通过环境变量切换', () => {
            const content = readFileSync(appConfigPath, 'utf8')
            expect(content).toMatch(/env\.DATABASE_JOURNAL_MODE \|\| 'delete'/)
            expect(content).toMatch(/DATABASE_JOURNAL_MODES = \['delete', 'wal'\]/)
        })
    })

    describe.skip('package.json', () => {
        it('better-sqlite3 应保持在 12.8.x，防止自动升级引入不兼容变更', () => {
            const content = readFileSync(packageJsonPath, 'utf8')
            const betterSqlite3 = JSON.parse(content).dependencies['better-sqlite3']
            expect(betterSqlite3).toMatch(/^[\^]?12\.8\.\d+$/)
        })
    })
})
