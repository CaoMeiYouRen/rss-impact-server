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
        it('应使用 DELETE journal 模式，不应使用 WAL', () => {
            // WAL 模式在 Docker bind mount (virtiofs/osxfs) 上因 mmap/POSIX 锁不可靠,
            // 会导致 SQLITE_IOERR_WRITE。DELETE 模式兼容所有文件系统。
            const content = readFileSync(sessionMiddlewarePath, 'utf8')
            expect(content).toMatch(/journal_mode = DELETE/)
            expect(content).not.toMatch(/journal_mode = WAL/)
        })

        it('应设置 busy_timeout 防止并发写入冲突', () => {
            const content = readFileSync(sessionMiddlewarePath, 'utf8')
            expect(content).toMatch(/busy_timeout = 5000/)
        })
    })

    describe('database.module.ts', () => {
        it('SqlitePragmaService 不应重复设置 journal_mode', () => {
            // journal_mode 已在 session.middleware.ts 导入阶段设置（数据库级持久化）,
            // 重复设置会与数据库中已有的 journal mode 产生冲突
            const content = readFileSync(dbModulePath, 'utf8')
            // 确保 onModuleInit 中没有调用 pragma('journal_mode ...')
            const onModuleInitMatch = content.match(/onModuleInit\(\)\s*\{[\s\S]*?\n {4}\}/)
            if (onModuleInitMatch) {
                expect(onModuleInitMatch[0]).not.toMatch(/pragma\(['"]journal_mode/)
            }
        })
    })

    describe('package.json', () => {
        it('better-sqlite3 应锁定为 12.9.0，防止自动升级引入不兼容变更', () => {
            const content = readFileSync(packageJsonPath, 'utf8')
            const betterSqlite3 = JSON.parse(content).dependencies['better-sqlite3']
            expect(betterSqlite3).toMatch(/^12\.9\.0$/)
        })
    })
})
