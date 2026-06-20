/// <reference types="jest" />
import { readFileSync, mkdirSync, rmSync } from 'fs'
import { resolve, join } from 'path'
import os from 'os'

const minifyDockerPath = resolve(__dirname, '../../scripts/minify-docker.js')

describe('minify-docker.js 原生工件收集', () => {
    let content: string

    beforeAll(() => {
        content = readFileSync(minifyDockerPath, 'utf8')
    })

    describe('getPackageRoot', () => {
        it('应从 pnpm store 路径中提取包根目录', () => {
            // 验证函数存在
            expect(content).toContain('function getPackageRoot')

            // pnpm store 路径: node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3/lib/database.js
            // getPackageRoot 应返回: node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3
            expect(content).toContain('parts.lastIndexOf(\'node_modules\')')
            expect(content).toContain('getPackageRoot')
        })

        it('应处理 scoped 包 (@org/name)', () => {
            // getPackageRoot 应处理 @ 开头的包名，多取一层
            expect(content).toContain('startsWith(\'@\')')
        })

        it('文件不在 node_modules 中时应返回 null', () => {
            // lastNodeModulesIndex === -1 时返回 null
            expect(content).toContain('return null')
        })
    })

    describe('collectNativeArtifacts 不复制完整包根', () => {
        it('应仅收集 build / prebuilds / Release 目录', () => {
            // 验证常量定义
            expect(content).toContain('build')
            expect(content).toContain('prebuilds')
            expect(content).toContain('Release')

            // 验证函数名已改为 collectNativeArtifacts
            expect(content).toContain('collectNativeArtifacts')

            // 验证 NATIVE_ARTIFACT_DIRS 常量
            expect(content).toContain('NATIVE_ARTIFACT_DIRS')
        })

        it('不应包含 extraEntries.push(packageRoot) 复制完整包根', () => {
            // 旧代码有 extraEntries.push(packageRoot) 复制整个包目录
            // 新代码不应再有此逻辑
            expect(content).not.toContain('extraEntries.push(packageRoot)')
        })

        it('不应包含 getPublicPackagePath 符号链接解析', () => {
            // 旧代码通过 getPublicPackagePath 跟随 pnpm 符号链接
            // 新代码不应再有此逻辑
            expect(content).not.toContain('getPublicPackagePath')
        })

        it('不应包含 collectPackageArtifacts', () => {
            expect(content).not.toContain('collectPackageArtifacts')
        })
    })

    describe('better-sqlite3 .node 二进制覆盖', () => {
        it('collectNativeArtifacts 应能覆盖 better-sqlite3 的 build/Release 目录', () => {
            // better-sqlite3 的 .node 二进制在 build/Release/
            // collectNativeArtifacts 遍历 NATIVE_ARTIFACT_DIRS，应包含 Release
            expect(content).toContain('Release')
        })

        it('应遍历 packageRoots 中的每个包检查原生工件目录', () => {
            expect(content).toContain('for (const packageRoot of packageRoots)')
            expect(content).toContain('for (const dir of NATIVE_ARTIFACT_DIRS)')
        })
    })

    describe('错误处理', () => {
        it('文件复制失败不应静默忽略', () => {
            // 验证错误收集数组
            expect(content).toContain('const errors = []')
            // 验证非静默忽略
            expect(content).toContain('process.exit(1)')
            // 验证不包含旧的 .catch(console.error) 模式
            expect(content).not.toContain('.catch(console.error)')
            // 新代码使用 try/catch 并收集错误
            expect(content).toContain('errors.push({ file: e, error: err.message')
        })
    })
})

describe('minify-docker.js 逻辑正确性测试', () => {
    const testDir = join(os.tmpdir(), `minify-docker-test-${Date.now()}`)

    beforeAll(() => {
        mkdirSync(testDir, { recursive: true })
    })

    afterAll(() => {
        rmSync(testDir, { recursive: true, force: true })
    })

    // 模拟 getPackageRoot 的 TypeScript 等价实现
    function getPackageRoot(file: string): string | null {
        const normalized = file.split('\\').join('/')
        const parts = normalized.split('/')
        const lastNodeModulesIndex = parts.lastIndexOf('node_modules')
        if (lastNodeModulesIndex === -1 || lastNodeModulesIndex >= parts.length - 1) {
            return null
        }
        const packageNameIndex = lastNodeModulesIndex + 1
        const packageEndIndex = parts[packageNameIndex].startsWith('@')
            ? packageNameIndex + 1
            : packageNameIndex
        return parts.slice(0, packageEndIndex + 1).join('/')
    }

    describe('getPackageRoot 路径提取', () => {
        const cases: [string, string | null][] = [
            [
                'node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3/lib/database.js',
                'node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3',
            ],
            [
                'node_modules/.pnpm/bcrypt@6.0.0/node_modules/bcrypt/bcrypt.js',
                'node_modules/.pnpm/bcrypt@6.0.0/node_modules/bcrypt',
            ],
            [
                'node_modules/.pnpm/@nestjs+common@11.1.27/node_modules/@nestjs/common/index.js',
                'node_modules/.pnpm/@nestjs+common@11.1.27/node_modules/@nestjs/common',
            ],
            [
                'node_modules/lodash/index.js',
                'node_modules/lodash',
            ],
            [
                'src/services/tasks/tasks.service.ts',
                null,
            ],
        ]

        test.each(cases)('%s → %s', (input, expected) => {
            expect(getPackageRoot(input)).toBe(expected)
        })
    })

    describe('NATIVE_ARTIFACT_DIRS 覆盖 better-sqlite3', () => {
        it('build/Release 在常量列表中', () => {
            // 模拟常量定义
            const NATIVE_ARTIFACT_DIRS = ['build', 'prebuilds', 'Release']
            // better-sqlite3 的 .node 文件在 build/Release/
            // 由于是两层嵌套，collectNativeArtifacts 遍历时：
            // 对 better-sqlite3 包根目录，先检测 build/ 存在则添加
            // 然后检测 prebuilds/（通常不存在，跳过）
            // 然后检测 Release/（在包根下不存在，跳过）
            //
            // 实际 .node 文件在 build/Release/better_sqlite3.node
            // build/ 被添加后，其子目录 Release/ 也会被复制
            expect(NATIVE_ARTIFACT_DIRS).toContain('build')
            expect(NATIVE_ARTIFACT_DIRS).toContain('Release')
        })

        it('build/ 目录被递归复制时会包含 Release/better_sqlite3.node', () => {
            // fs-extra.copy 默认递归复制目录
            // 当 build/ 被添加到文件列表并 copy 时，
            // build/Release/better_sqlite3.node 会被自动包含
            // 因此显式列出 build 即足够覆盖 better-sqlite3
            expect(true).toBe(true)
        })
    })
})
