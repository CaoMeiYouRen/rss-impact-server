const { createTransformer } = require('ts-jest').default

const tsJestTransformer = createTransformer({
    tsconfig: { allowJs: true },
})

/**
 * 部分依赖为 ESM-only，需要交给 ts-jest 转译为 CJS 后再由 Jest 执行。
 * ESM 中有两种语法在 CJS 包装器内不合法，这里在转译前做等价替换：
 * 1. import.meta.url -> __filename
 * 2. 顶层 `const require = createRequire(import.meta.url)` 会与 CJS 的 require 重名，改名为 __esmRequire
 */
function toCommonJsSafe(sourceText) {
    let text = sourceText.replace(/import\.meta\.url/g, '__filename')
    if (/const\s+require\s*=\s*createRequire\(/.test(text)) {
        text = text.replace(/const\s+require\s*=\s*/g, 'const __esmRequire = ')
        text = text.replace(/(?<![A-Za-z0-9_$.])require\(/g, '__esmRequire(')
    }
    return text
}

module.exports = {
    canInstrument: tsJestTransformer.canInstrument,
    getCacheKey(sourceText, sourcePath, options) {
        return tsJestTransformer.getCacheKey(toCommonJsSafe(sourceText), sourcePath, options)
    },
    process(sourceText, sourcePath, options) {
        return tsJestTransformer.process(toCommonJsSafe(sourceText), sourcePath, options)
    },
}
