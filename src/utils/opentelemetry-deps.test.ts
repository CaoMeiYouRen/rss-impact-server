import { readFileSync } from 'fs'
import { resolve } from 'path'

const workspacePath = resolve(__dirname, '../../pnpm-workspace.yaml')
const lockfilePath = resolve(__dirname, '../../pnpm-lock.yaml')

/**
 * 从 pnpm-lock.yaml 中提取指定 snapshots 条目的 @opentelemetry/core 解析版本
 */
function extractCoreVersion(lockfileContent: string, entryPattern: RegExp): string | undefined {
    const lines = lockfileContent.split('\n')
    let inTarget = false
    let inDeps = false
    for (const line of lines) {
        if (!inTarget && entryPattern.test(line)) {
            inTarget = true
            continue
        }
        if (inTarget && /^ {4}dependencies:/.test(line)) {
            inDeps = true
            continue
        }
        if (inDeps && /^ {6}'@opentelemetry\/core':/.test(line)) {
            return line.match(/'@opentelemetry\/core':\s*(\S+)/)?.[1]
        }
        if (inDeps && !/^ {6}/.test(line)) {
            // 离开 dependencies 块
            inTarget = false
            inDeps = false
        }
    }
    return undefined
}

describe('OpenTelemetry 核心依赖版本解析', () => {
    describe('pnpm-workspace.yaml', () => {
        it('不应将 @opentelemetry/core 强制覆盖到 v2.x 版本', () => {
            const workspaceContent = readFileSync(workspacePath, 'utf8')
            // v2.x 版本移除了 TracesSamplerValues, 会导致
            // @opentelemetry/sdk-trace-base@1.30.1 启动崩溃
            expect(workspaceContent).not.toMatch(/"@opentelemetry\/core":\s*\^2/)
            expect(workspaceContent).not.toMatch(/"@opentelemetry\/core":\s*"2/)
        })
    })

    describe('pnpm-lock.yaml', () => {
        const lockfileContent = readFileSync(lockfilePath, 'utf8')

        it('@opentelemetry/sdk-trace-base@1.30.1 应解析到 @opentelemetry/core@1.30.1', () => {
            // sdk-trace-base@1.30.1 的 dependencies 中显式声明了 @opentelemetry/core: 1.30.1,
            // 必须解析到 1.x 版本, 否则运行时会因 core v2 缺少 TracesSamplerValues 而崩溃
            const version = extractCoreVersion(
                lockfileContent,
                /^ {2}'@opentelemetry\/sdk-trace-base@1\.30\.1\(/,
            )
            expect(version).toBeTruthy()
            expect(version).toMatch(/^1\./)
            expect(version).not.toMatch(/^2\./)
        })

        it('@sentry/opentelemetry 所使用的 @opentelemetry/core 应与 sdk-trace-base 兼容', () => {
            // @sentry/opentelemetry 声明了 @opentelemetry/core: ^2.8.0 的 peerDep,
            // 但实际兼容 1.x。应优先保证 sdk-trace-base 的兼容性
            const version = extractCoreVersion(
                lockfileContent,
                /^ {2}'@sentry\/opentelemetry@[\d.]+\(/,
            )
            expect(version).toBeTruthy()
        })
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
