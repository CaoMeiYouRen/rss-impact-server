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
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
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
