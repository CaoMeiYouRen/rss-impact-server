/**
 * 以下依赖已改为 ESM-only，Jest 以 CJS 运行时需要交给 ts-jest 转译后才能执行。
 * 新增此类依赖时，将包名补充到该数组中。
 */
const ESM_ONLY_PACKAGES = [
    'agent-base',
    'entities',
    'jose',
    'jwks-rsa',
    'https-proxy-agent',
    'proxy-agent-negotiate',
    'socks-proxy-agent',
    '@nestjs/typeorm',
    'push-all-in-one',
]

// 兼容 pnpm 中 scope 包的目录形式（@nestjs+typeorm）
const packagePattern = ESM_ONLY_PACKAGES.map((name) => name.replace('/', '[+/]')).join('|')

export const transform = {
    '^.+\\.(t|j)s$': '<rootDir>/../jest-esm-transformer.cjs',
}

export const transformIgnorePatterns = [
    `/node_modules/(?!(\\.pnpm|${packagePattern}))`,
    `/node_modules/\\.pnpm/(?!(?:${packagePattern})@)`,
]
