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

async function collectNativeArtifacts(projectRoot, packageRoots) {
    const extraEntries = []
    for (const packageRoot of packageRoots) {
        for (const relativePath of ['build', 'prebuilds']) {
            const fullPath = path.join(projectRoot, packageRoot, relativePath)
            if (await fs.pathExists(fullPath)) {
                extraEntries.push(path.join(packageRoot, relativePath))
            }
        }
    }
    return extraEntries
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
    return Promise.all(fileList.map((e) => fs.copy(path.join(projectRoot, e), path.join(resultFolder, e)).catch(console.error),
    ))
})().catch((err) => {
    // fix unhandled promise rejections
    console.error(err, err.stack)
    process.exit(1)
})
