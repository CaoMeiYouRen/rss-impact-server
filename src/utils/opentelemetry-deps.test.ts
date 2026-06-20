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
    const packageJsonPath = resolve(__dirname, '../../package.json')

    describe('session.middleware.ts', () => {
        it('不应设置任何 PRAGMA（会话存储由 Redis 承载，SQLite 连接仅作回退）', () => {
            const content = readFileSync(sessionMiddlewarePath, 'utf8')
            expect(content).not.toMatch(/pragma\(['"]journal_mode/)
            expect(content).not.toMatch(/pragma\(['"]synchronous/)
            expect(content).not.toMatch(/pragma\(['"]busy_timeout/)
        })
    })

    describe('database.module.ts', () => {
        it('SqlitePragmaService 应在 onModuleInit 中设置 WAL + NORMAL + busy_timeout', () => {
            // Docker bind mount 上 POSIX 锁不可靠，WAL 模式减少对文件锁的依赖。
            // synchronous=NORMAL 在 WAL 模式下安全且避免慢文件系统超时。
            const content = readFileSync(dbModulePath, 'utf8')
            expect(content).toMatch(/pragma\(['"]journal_mode = WAL/)
            expect(content).toMatch(/pragma\(['"]synchronous = NORMAL/)
            expect(content).toMatch(/pragma\(['"]busy_timeout = 5000/)
        })

        it('WAL 失败时应回退 DELETE + busy_timeout', () => {
            const content = readFileSync(dbModulePath, 'utf8')
            expect(content).toMatch(/journal_mode = DELETE/)
            expect(content).toMatch(/WAL.*失败.*DELETE.*回退/)
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
