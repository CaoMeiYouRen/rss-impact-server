const path = require('path')
const fs = require('fs-extra')
const { nodeFileTrace } = require('@vercel/nft')
// !!! if any new dependencies are added, update the Dockerfile !!!

function getPackageRoot(file) {
    const normalized = file.split(path.sep).join('/')
    const parts = normalized.split('/')
    const lastNodeModulesIndex = parts.lastIndexOf('node_modules')
    if (lastNodeModulesIndex === -1 || lastNodeModulesIndex >= parts.length - 1) {
        return null
    }
    const packageNameIndex = lastNodeModulesIndex + 1
    const packageEndIndex = parts[packageNameIndex].startsWith('@') ? packageNameIndex + 1 : packageNameIndex
    return parts.slice(0, packageEndIndex + 1).join('/')
}

/**
 * 收集 nft 静态分析无法追踪的原生工件目录。
 * better-sqlite3 等包通过 bindings/prebuild-install 动态加载 .node 二进制，
 * @vercel/nft 的 require() AST 分析无法静态解析这些动态路径。
 *
 * 策略：仅收集 build/、prebuilds/、Release/ 目录，不复制整个包根目录。
 * 复制整个包根目录会导致 pnpm 符号链接被展开为真实目录，改变模块解析路径。
 */
const NATIVE_ARTIFACT_DIRS = ['build', 'prebuilds', 'Release']

async function collectNativeArtifacts(projectRoot, packageRoots) {
    const entries = []
    for (const packageRoot of packageRoots) {
        for (const dir of NATIVE_ARTIFACT_DIRS) {
            const fullPath = path.join(projectRoot, packageRoot, dir)
            if (await fs.pathExists(fullPath)) {
                entries.push(path.join(packageRoot, dir))
            }
        }
    }
    return entries
}

(async () => {
    const projectRoot = path.resolve(process.env.PROJECT_ROOT || path.join(__dirname, '../'))
    const resultFolder = path.join(projectRoot, 'app-minimal') // no need to resolve, ProjectRoot is always absolute
    const pkg = await fs.readJSON(path.join(projectRoot, 'package.json'))

    let mainPath = ''
    const mainPaths = [pkg.main, 'dist/index.js', 'dist/main.js']
    for (const key of mainPaths) {
        const fullPath = path.join(projectRoot, key)
        if (await fs.pathExists(fullPath)) {
            mainPath = fullPath
        }
    }
    if (!mainPath) {
        process.exit(1)
    }
    const files = [mainPath, 'dist/workers/login-worker.js']
    console.log('Start analyzing, project root:', projectRoot)
    const { fileList: fileSet } = await nodeFileTrace(files, {
        base: projectRoot,
        paths: {
            '@/': 'dist/',
        },
    })
    let fileList = Array.from(fileSet)
    console.log('Total touchable files:', fileList.length)
    fileList = fileList.filter((file) => file.startsWith('node_modules')) // only need node_modules
    const packageRoots = Array.from(new Set(fileList.map(getPackageRoot).filter(Boolean)))
    const nativeArtifacts = await collectNativeArtifacts(projectRoot, packageRoots)
    fileList = Array.from(new Set([...fileList, ...nativeArtifacts]))
    console.log('Total files need to be copied (touchable files in node_modules):', fileList.length)
    console.log('Start copying files, destination:', resultFolder)
    const errors = []
    for (const e of fileList) {
        try {
            await fs.copy(path.join(projectRoot, e), path.join(resultFolder, e))
        } catch (err) {
            errors.push({ file: e, error: err.message || err })
        }
    }
    if (errors.length > 0) {
        console.error('文件复制失败:', JSON.stringify(errors, null, 2))
        process.exit(1)
    }
    console.log('文件复制完成，共', fileList.length, '个文件')
})().catch((err) => {
    // fix unhandled promise rejections
    console.error(err, err.stack)
    process.exit(1)
})
