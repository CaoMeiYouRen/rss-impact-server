# ESM 迁移评估报告

> 评估日期：2026-07-25
> 基于项目：rss-impact-server@1.18.4
> **2026-11-14 更新**：相关依赖已全部升级完成，无需整体迁移 ESM。实际方案见文末「实际解决方案」。

## 背景

项目当前使用 CommonJS 模块系统，面临多个依赖包已转为 ESM-only 导致无法升级的问题。本报告评估从 CommonJS 迁移到 ESM 的工作量、风险和推荐策略。

## 当前状态

| 项目 | 值 | 说明 |
|---|---|---|
| NestJS | ^11.1.19 | 官方仍输出 CJS，v12（2026 Q3）将原生支持 ESM |
| TypeScript | ^6.0.3 | 已支持完整 CJS/ESM interop |
| Node.js | ^22.23.4 \|\| >=24.22.1 | 原生支持 `require()` ESM，无需实验性参数 |
| 当前模块 | CommonJS | `tsconfig: module: commonjs`，`package.json` 无 `type` 字段 |

## 受影响的依赖

以下 PR 对应的依赖因 ESM-only 无法直接升级：

| 依赖 | 当前版本 | 目标版本 | 阻塞原因 |
|---|---|---|---|
| https-proxy-agent | 7.x | 9.x | ESM-only，无 CJS 回退 |
| socks-proxy-agent | 8.x | 10.x | ESM-only，无 CJS 回退 |
| entities | 7.x | 8.x | ESM-only（`type: module`） |
| jwks-rsa | 3.x | 4.x | 依赖的 jose v6 为 ESM-only |

## 需要修改的内容

### 配置文件

| 文件 | 修改项 |
|---|---|
| `package.json` | 添加 `"type": "module"` |
| `tsconfig.json` | `module` → `"NodeNext"`，`moduleResolution` → `"NodeNext"`，或 `"module": "ESNext"` |
| `.npmrc` | 添加 `node-options=--experimental-require-module` |

### 代码改造

| 类别 | 数量 | 具体位置 |
|---|---|---|
| `require()` 调用 | 2 处 | `src/main.ts:4`、`test/app.e2e-test.ts:3`（module-alias） |
| `__dirname` 使用 | 7 处 | `src/main.ts`(1)、`test/app.e2e-test.ts`(3)、`src/utils/minify-docker.test.ts`(1)、`src/utils/opentelemetry-deps.test.ts`(5) |
| JS 脚本 | 1 | `scripts/minify-docker.js`（`require` + `__dirname`）— 需改 `.mjs` |
| Jest 配置 | 2 | 主 `jest.config.ts` + e2e `jest.config.e2e.ts`，需加 `useESM: true` 和 `extensionsToTreatAsEsm` |

### `__dirname` 替换模式

ESM 中 `__dirname` 不可用，需替换为：

```ts
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
```

或使用 `fix-esm`、`esm-path` 等工具库简化。

### module-alias 替代

`module-alias` 依赖 `require()`，在 ESM 中不可用。替代方案：

1. **Subpath imports**（推荐）：在 `package.json` 中声明：

```json
{
  "imports": {
    "@/*": "./dist/*"
  }
}
```

2. **`import.meta.resolve`**：使用 Node.js 原生的解析机制。

## 核心风险

### 1. NestJS 当前不支持原生 ESM 输出

NestJS v11 的 `nest build` 使用 Webpack 打包，输出格式仍为 CommonJS。社区普遍做法：

- 用 `nest build`（Webpack）打包，Webpack 可处理 ESM/CJS 混用（本项目已如此）
- 或等 **NestJS v12**（2026 Q3）原生支持 ESM

### 2. module-alias 路径别名

`@/` 路径别名在 ESM 中需改用 subpath imports 或 `import.meta.resolve`，涉及项目所有导入路径。

### 3. Jest + ESM

虽然 `ts-jest` 支持 ESM（需 `useESM: true`），且 `test:e2e` 已使用 `--experimental-vm-modules`，但 Jest 对 ESM 的支持仍有已知问题（如 `transformIgnorePatterns` 配置、ESM 模块模拟等）。

### 4. NestJS v12 工具链变更

NestJS v12 将默认使用 **Vitest** 替代 Jest、**oxlint** 替代 ESLint、**Rspack** 替代 Webpack。若现在迁移 ESM 到 v11，v12 发布后还需适配新工具链。

## 工作量估算

| 方案 | 估计工时 | 风险 | 说明 |
|---|---|---|---|
| **等 NestJS v12**（推荐） | 0 | 低 | 等待上游框架原生支持，配合官方迁移指南 |
| **现在迁移 ESM** | 3-5 天 | 中高 | 含测试调试，Jest + NestJS + ts-jest 可能有不兼容 |
| **短期 workaround** | 0.5 天 | 低 | 配置 `.npmrc` + 处理个别包 |

## 推荐策略

### 短期（立即执行）

配置 `.npmrc` 启用 `--experimental-require-module`，允许 CJS `require()` ESM 模块：

```ini
# .npmrc
node-options=--experimental-require-module
```

### 中期（等 NestJS v12）

NestJS v12 发布后（2026 Q3），按官方迁移指南统一迁移：

- `package.json` 添加 `"type": "module"`
- `tsconfig.json` 更新 `module` 和 `moduleResolution`
- 迁移 Jest → Vitest（NestJS v12 默认）
- 迁移 ESLint → oxlint（NestJS v12 默认）
- 替换所有 `__dirname` 为 `import.meta.url` 模式
- 替换 `module-alias` 为 subpath imports

### 长期

- 评估是否完全迁移或保留 Webpack 构建（`nest build` 自动处理 ESM/CJS 混用）
- 监控上游依赖的 ESM 支持状态

## 实际解决方案（2026-11）

项目保持 CommonJS 构建，通过 Node.js 原生 `require()` ESM 与 Jest 转译解决依赖升级问题，未执行整体 ESM 迁移。

### 运行时

Node.js 22.12+ 起 `require()` 可以加载同步 ESM 模块，项目 `engines` 已要求 `^22.23.4 || >=24.22.1`，因此 `entities@8`、`jwks-rsa@4`、`https-proxy-agent@9`、`@nestjs/typeorm@12` 等 ESM-only 依赖可直接在 CJS 产物中 `require`。

### 测试

Jest 的模块加载器不支持 `require(ESM)`，因此新增了测试侧的转译层：

| 文件 | 作用 |
|---|---|
| `jest.shared.ts` | 维护 ESM-only 依赖列表（`ESM_ONLY_PACKAGES`）与 `transformIgnorePatterns` |
| `jest-esm-transformer.cjs` | 基于 ts-jest 的转译器，并将 ESM 中不合法的 `import.meta.url` 替换为 `__filename` |

主测试与 e2e 配置均引用 `jest.shared.ts`。**新增 ESM-only 依赖时，需要把包名补充到 `ESM_ONLY_PACKAGES`**，否则对应测试会报 `Cannot use import statement outside a module`。

同时移除了 e2e 的 `--experimental-vm-modules`：该参数会让 Jest 按 `type: module` 解析被转译为 CJS 的依赖，反而导致 `exports is not defined`。

### 已升级依赖

| 依赖 | 原版本 | 当前版本 |
|---|---|---|
| entities | 7.x | 8.x |
| jwks-rsa | 3.x | 4.x |
| https-proxy-agent | 7.x | 9.x |
| @nestjs/typeorm | 11.x | 12.x |
| push-all-in-one | 4.5.2 | 4.7.0 |

### 其他注意事项

- `https-proxy-agent@9` 未声明顶层 `types` 字段，`tsconfig.json` 通过 `paths` 指向其 `dist/index.d.ts`。
- `openai@7` 移除了 `httpAgent`，`src/utils/proxy-fetch.ts` 使用 axios + 现有代理 Agent 提供 fetch 适配器，保持 http/https/socks 代理能力。
- 修改依赖后重新生成 lockfile 时，pnpm 11 可能移除 `ajv-formats@2.1.1` 对 `ajv` 的依赖（可选 peer），需确认 `pnpm-lock.yaml` 中该条目仍包含 `ajv: 8.20.0`，否则 e2e 会因解析到 ajv@6 失败。
- TypeScript 6 默认开启 `strict` 且 `types` 默认为空，`tsconfig.json` 已显式声明 `strict: false`、`types` 与 `moduleResolution: node10`；`tsconfig.build.json` 显式设置 `rootDir: ./src` 以保持 `dist/main.js` 输出位置。
