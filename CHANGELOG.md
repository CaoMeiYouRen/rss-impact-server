# rss-impact-server

## [1.18.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.18.0...v1.18.1) (2026-04-04)


### ✅ 测试

* 添加类型检查步骤以确保代码质量 ([9561979](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9561979))


### 🐛 Bug 修复

* **deps:** repair duplicated mapping key in pnpm-lock.yaml ([3c9f1de](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3c9f1de))


### 📦 代码重构

* 修改类型断言以提高代码类型安全性 ([ad290a2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ad290a2))
* 将类型定义从 type 更改为 interface 以提高可读性和一致性 ([70bd50b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/70bd50b))

# [1.18.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.17.2...v1.18.0) (2025-12-27)


### ✅ 测试

* 更新测试用例以使用 better-sqlite3 数据库驱动 ([b7ae27c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b7ae27c))


### ✨ 新功能

* 使用 feedsmith 替换 art-template 生成 Atom、RSS 和 JSON Feed ([bfdf856](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bfdf856))


### 🐛 Bug 修复

* **db:** 升级数据库配置以支持 better-sqlite3 驱动 ([90552a2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/90552a2))
* 移除 connect-sqlite3 依赖，添加 better-sqlite3 支持的会话存储 ([6277adc](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6277adc))
* 重构 Atom 和 RSS 函数以增强可读性和错误处理 ([33185a0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/33185a0))

## [1.17.2](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.17.1...v1.17.2) (2025-11-22)


### ✅ 测试

* 添加 IsCustomURL 装饰器的单元测试 ([abd6c6e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/abd6c6e))
* 添加对 formatGuid 和 rssItemToArticle 函数的单元测试以增强测试覆盖率 ([70e462d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/70e462d))


### 🐛 Bug 修复

* 更新 formatGuid 和 rssItemToArticle 函数以增强链接处理逻辑 ([c3c3204](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c3c3204))

## [1.17.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.17.0...v1.17.1) (2025-11-08)


### 🐛 Bug 修复

* **notification:** 添加基于isRemotePush的远程推送字段条件验证 ([0956af9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0956af9))

## 1.17.0 (2025-11-01)

* chore: 移除旧的 commitlint 配置并添加新的配置 ([709c149](https://github.com/CaoMeiYouRen/rss-impact-server/commit/709c149))
* chore: 移除旧的 ESLint 配置文件并添加新的配置文件 ([df912d7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/df912d7))
* chore(deps-dev): bump @nestjs/cli from 11.0.7 to 11.0.10 ([cdc437f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/cdc437f))
* chore(deps-dev): bump @nestjs/schematics from 11.0.5 to 11.0.7 ([c7d81c8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c7d81c8))
* chore(deps-dev): bump @nestjs/schematics from 11.0.7 to 11.0.9 ([4fbd562](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4fbd562))
* chore(deps-dev): bump @types/connect-sqlite3 from 0.9.5 to 0.9.6 ([cdb80b0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/cdb80b0))
* chore(deps-dev): bump @types/cookie-parser from 1.4.9 to 1.4.10 ([e3d08d1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e3d08d1))
* chore(deps-dev): bump @types/express from 5.0.3 to 5.0.5 ([06d1e55](https://github.com/CaoMeiYouRen/rss-impact-server/commit/06d1e55))
* chore(deps-dev): bump @types/md5 from 2.3.5 to 2.3.6 ([170d608](https://github.com/CaoMeiYouRen/rss-impact-server/commit/170d608))
* chore(deps-dev): bump @types/node from 24.1.0 to 24.2.1 ([ec4daed](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ec4daed))
* chore(deps-dev): bump @types/node from 24.2.1 to 24.3.0 ([ec54ea1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ec54ea1))
* chore(deps-dev): bump @types/node from 24.3.0 to 24.6.0 ([2bb10af](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2bb10af))
* chore(deps-dev): bump @types/node from 24.6.0 to 24.9.2 ([51ce3f7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/51ce3f7))
* chore(deps-dev): bump @types/pg from 8.15.4 to 8.15.5 ([a36eab8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a36eab8))
* chore(deps-dev): bump @types/validator from 13.15.2 to 13.15.3 ([866e7b3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/866e7b3))
* chore(deps-dev): bump @types/validator from 13.15.3 to 13.15.4 ([9b0b0ce](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9b0b0ce))
* chore(deps-dev): bump commitlint from 19.8.1 to 20.1.0 ([a81f385](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a81f385))
* chore(deps-dev): bump commitlint-config-cmyr from 1.0.0-beta.2 to 1.0.0 ([ca74b2d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ca74b2d))
* chore(deps-dev): bump conventional-changelog-cmyr-config ([39009c6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/39009c6))
* chore(deps-dev): bump cross-env from 10.0.0 to 10.1.0 ([3f80edb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3f80edb))
* chore(deps-dev): bump cz-conventional-changelog-cmyr ([3e7df37](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3e7df37))
* chore(deps-dev): bump debug from 4.4.1 to 4.4.3 ([5ea69a2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5ea69a2))
* chore(deps-dev): bump eslint from 9.33.0 to 9.34.0 ([d5eed47](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d5eed47))
* chore(deps-dev): bump eslint from 9.34.0 to 9.36.0 ([49b7c40](https://github.com/CaoMeiYouRen/rss-impact-server/commit/49b7c40))
* chore(deps-dev): bump eslint from 9.36.0 to 9.38.0 ([e1bcbd6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e1bcbd6))
* chore(deps-dev): bump eslint-config-cmyr ([6c5ad20](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6c5ad20))
* chore(deps-dev): bump eslint-config-cmyr from 2.0.0 to 2.0.1 ([7e78752](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7e78752))
* chore(deps-dev): bump eslint-config-cmyr from 2.0.0-beta.15 to 2.0.0 ([2d28b80](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2d28b80))
* chore(deps-dev): bump jest from 30.0.5 to 30.1.1 ([15ab975](https://github.com/CaoMeiYouRen/rss-impact-server/commit/15ab975))
* chore(deps-dev): bump jest from 30.1.1 to 30.2.0 ([fa892a4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fa892a4))
* chore(deps-dev): bump lint-staged from 16.1.2 to 16.1.4 ([fa7e420](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fa7e420))
* chore(deps-dev): bump lint-staged from 16.1.4 to 16.1.5 ([9f465ea](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9f465ea))
* chore(deps-dev): bump lint-staged from 16.1.5 to 16.2.3 ([4092e59](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4092e59))
* chore(deps-dev): bump lint-staged from 16.2.3 to 16.2.6 ([42dece5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/42dece5))
* chore(deps-dev): bump octokit from 5.0.3 to 5.0.5 ([14ad051](https://github.com/CaoMeiYouRen/rss-impact-server/commit/14ad051))
* chore(deps-dev): bump ts-jest from 29.4.0 to 29.4.1 ([8d40b93](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8d40b93))
* chore(deps-dev): bump ts-jest from 29.4.1 to 29.4.4 ([28dcc77](https://github.com/CaoMeiYouRen/rss-impact-server/commit/28dcc77))
* chore(deps-dev): bump tsx from 4.20.3 to 4.20.4 ([f22e51a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f22e51a))
* chore(deps-dev): bump tsx from 4.20.4 to 4.20.5 ([be7332f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/be7332f))
* chore(deps-dev): bump tsx from 4.20.5 to 4.20.6 ([38d4bf6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/38d4bf6))
* chore(deps-dev): bump typescript from 5.8.3 to 5.9.2 ([6cdf34f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6cdf34f))
* chore(deps-dev): bump typescript from 5.9.2 to 5.9.3 ([065a219](https://github.com/CaoMeiYouRen/rss-impact-server/commit/065a219))
* chore(deps-dev): bump vitepress from 1.6.3 to 1.6.4 ([dec26c6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/dec26c6))
* chore(deps): bump @nestjs/common from 11.1.5 to 11.1.6 ([3283acc](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3283acc))
* chore(deps): bump @nestjs/common from 11.1.6 to 11.1.8 ([ee12e9a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ee12e9a))
* chore(deps): bump @nestjs/schedule from 6.0.0 to 6.0.1 ([e0f8660](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e0f8660))
* chore(deps): bump actions/checkout from 4 to 5 ([f4f3955](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f4f3955))
* chore(deps): bump actions/configure-pages from 4 to 5 ([5e0e536](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5e0e536))
* chore(deps): bump actions/setup-node from 4 to 5 ([b777a55](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b777a55))
* chore(deps): bump actions/setup-node from 5 to 6 ([efa29c0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/efa29c0))
* chore(deps): bump actions/upload-pages-artifact from 3 to 4 ([f235b71](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f235b71))
* chore(deps): bump alstr/todo-to-issue-action from 4 to 5 ([5b28cab](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5b28cab))
* chore(deps): bump axios from 1.11.0 to 1.12.0 ([e075eb1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e075eb1))
* chore(deps): bump axios from 1.12.0 to 1.13.1 ([fba1e87](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fba1e87))
* chore(deps): bump codecov/codecov-action from 4.0.1 to 5.5.0 ([3f4d334](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3f4d334))
* chore(deps): bump codecov/codecov-action from 5.5.0 to 5.5.1 ([f15c827](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f15c827))
* chore(deps): bump cron from 4.3.2 to 4.3.3 ([fa42449](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fa42449))
* chore(deps): bump dayjs from 1.11.13 to 1.11.18 ([10c5208](https://github.com/CaoMeiYouRen/rss-impact-server/commit/10c5208))
* chore(deps): bump dayjs from 1.11.18 to 1.11.19 ([387f8b7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/387f8b7))
* chore(deps): bump docker/build-push-action from 5 to 6 ([2abdfe3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2abdfe3))
* chore(deps): bump dotenv from 17.2.1 to 17.2.3 ([826349b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/826349b))
* chore(deps): bump entities from 6.0.1 to 7.0.0 ([7f2572c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7f2572c))
* chore(deps): bump express-rate-limit from 8.0.1 to 8.1.0 ([a853083](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a853083))
* chore(deps): bump express-rate-limit from 8.1.0 to 8.2.1 ([d502f19](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d502f19))
* chore(deps): bump fs-extra from 11.3.0 to 11.3.1 ([ad20824](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ad20824))
* chore(deps): bump fs-extra from 11.3.1 to 11.3.2 ([bff5821](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bff5821))
* chore(deps): bump ioredis from 5.6.1 to 5.7.0 ([bad999f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bad999f))
* chore(deps): bump ioredis from 5.7.0 to 5.8.0 ([43ad738](https://github.com/CaoMeiYouRen/rss-impact-server/commit/43ad738))
* chore(deps): bump ioredis from 5.8.0 to 5.8.2 ([1e9ed4e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1e9ed4e))
* chore(deps): bump mysql2 from 3.14.2 to 3.14.3 ([1f0b939](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1f0b939))
* chore(deps): bump mysql2 from 3.14.3 to 3.15.1 ([37f0237](https://github.com/CaoMeiYouRen/rss-impact-server/commit/37f0237))
* chore(deps): bump mysql2 from 3.15.1 to 3.15.3 ([523ee01](https://github.com/CaoMeiYouRen/rss-impact-server/commit/523ee01))
* chore(deps): bump push-all-in-one from 4.4.3 to 4.4.4 ([3db29c9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3db29c9))
* chore(deps): bump push-all-in-one from 4.4.4 to 4.4.7 ([6805c8d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6805c8d))
* chore(deps): bump rate-limit-redis from 4.2.1 to 4.2.2 ([f93e066](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f93e066))
* chore(deps): bump rate-limit-redis from 4.2.2 to 4.2.3 ([eb7bda7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/eb7bda7))
* chore(deps): bump rimraf from 6.0.1 to 6.1.0 ([8fb51a0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8fb51a0))
* chore(deps): bump tar-fs from 2.1.3 to 2.1.4 ([7151489](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7151489))
* chore(deps): bump turndown from 7.2.0 to 7.2.1 ([4d9cad0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4d9cad0))
* chore(deps): bump turndown from 7.2.1 to 7.2.2 ([26f8bd3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/26f8bd3))
* chore(deps): bump typeorm from 0.3.25 to 0.3.26 ([73a04fb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/73a04fb))
* chore(deps): bump typeorm from 0.3.26 to 0.3.27 ([36a30e0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/36a30e0))
* chore(deps): bump validator from 13.15.15 to 13.15.20 ([a8d8508](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a8d8508))
* chore(deps): bump vite from 5.4.19 to 5.4.20, add tmp and sha.js dependencies ([4f64e20](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4f64e20))
* chore(deps): bump winston from 3.17.0 to 3.18.2 ([1012d7b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1012d7b))
* chore(deps): bump winston from 3.18.2 to 3.18.3 ([af82d42](https://github.com/CaoMeiYouRen/rss-impact-server/commit/af82d42))
* chore(deps): update multer to 2.0.2 and add form-data 4.0.4 ([1bbc104](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1bbc104))
* feat(notification): 添加远程推送功能及相关配置 ([f908651](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f908651))
* ci: 更新 dependabot 配置为每月调度并添加 GitHub Actions 支持 ([5dc1e4f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5dc1e4f))
* Merge branch 'master' of github.com:CaoMeiYouRen/rss-impact-server ([06a8696](https://github.com/CaoMeiYouRen/rss-impact-server/commit/06a8696))

# [1.16.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.15.3...v1.16.0) (2025-08-02)


### ⏪ 回退

* 回滚 chore(deps): bump connect-redis from 8.1.0 to 9.0.0 ([ab6f462](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ab6f462))


### ✨ 新功能

* **auth:** 支持 OIDC 兼容配置，添加动态检测和处理逻辑 ([2424afa](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2424afa))
* 添加 OIDC 认证支持，更新相关配置和回调处理 ([614963a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/614963a))


### 🐛 Bug 修复

* 更新 Auth0 登录重定向 URL 为 BASE_URL ([dd4a5e5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/dd4a5e5))

## [1.15.3](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.15.2...v1.15.3) (2025-06-14)


### 🐛 Bug 修复

* 在多个地方添加 enableCircularCheck 和 excludeExtraneousValues 选项以增强数据验证 ([717a5a7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/717a5a7))
* 添加对 JSON.stringify 结果类型的验证以增强装饰器的健壮性 ([06e13c0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/06e13c0))
* 移除不必要的 excludeExtraneousValues 选项以简化数据验证配置 ([eb5f4ba](https://github.com/CaoMeiYouRen/rss-impact-server/commit/eb5f4ba))

## [1.15.2](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.15.1...v1.15.2) (2025-05-31)


### 🐛 Bug 修复

* **api:** 添加 WxPusher 到支持的消息平台列表 ([6f71718](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6f71718))

## [1.15.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.15.0...v1.15.1) (2025-03-01)


### 🐛 Bug 修复

* 更新 push-all-in-one 依赖至 4.3.0，并优化推送类型映射 ([faf36ca](https://github.com/CaoMeiYouRen/rss-impact-server/commit/faf36ca))
* 添加响应格式配置到 AIConfig 和任务服务 ([89fa9c1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/89fa9c1))

# [1.15.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.14.4...v1.15.0) (2025-01-25)


### ✨ 新功能

* **notification:** 添加调试日志以增强推送功能的可追踪性 ([724e7f0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/724e7f0))

## [1.14.4](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.14.3...v1.14.4) (2025-01-11)


### ♻ 代码重构

* 优化对 Dingtalk 的 URL 风控处理 ([50f1356](https://github.com/CaoMeiYouRen/rss-impact-server/commit/50f1356))


### 🐛 Bug 修复

* 增强对 Markdown 消息类型的支持 ([e626f76](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e626f76))

## [1.14.3](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.14.2...v1.14.3) (2025-01-04)


### ♻ 代码重构

* **benchmarks:** 优化系统信息输出格式 ([54c50b1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/54c50b1))


### ✅ 测试

* **app:** 修复e2e测试中的app关闭逻辑 ([17ad4ab](https://github.com/CaoMeiYouRen/rss-impact-server/commit/17ad4ab))
* **e2e:** 优化测试数据库初始化逻辑，改用beforeAll和afterAll ([a5e33ee](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a5e33ee))
* **e2e:** 初始化测试数据库并启用会话中间件 ([e5d5517](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e5d5517))
* 修复 API 路径并添加响应头；优化服务逻辑 ([2a4ff2e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2a4ff2e))


### 🐛 Bug 修复

* 更改常量名称从 RESOURCE_SAVE_DAYS 为 ARTICLE_SAVE_DAYS ([f4e1f4f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f4e1f4f))

## [1.14.2](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.14.1...v1.14.2) (2024-12-21)


### ♻ 代码重构

* **app:** 优化获取版本和 Git 信息的时机 ([402e00b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/402e00b))
* **user:** 替换 bcryptjs 为 bcrypt ([8e967e6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8e967e6))


### ✅ 测试

* **e2e:** 优化数据库初始化逻辑 ([785e285](https://github.com/CaoMeiYouRen/rss-impact-server/commit/785e285))
* **e2e:** 完善 e2e 测试 ([f034a06](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f034a06))
* **e2e:** 添加测试数据库初始化逻辑；优化测试用例超时时间 ([7963b1a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7963b1a))
* **e2e:** 禁用会话中间件以测试无状态应用 ([291a582](https://github.com/CaoMeiYouRen/rss-impact-server/commit/291a582))
* **e2e:** 移除测试数据库初始化代码 ([857dcaf](https://github.com/CaoMeiYouRen/rss-impact-server/commit/857dcaf))
* 增加测试超时配置和数据库清理；优化 e2e 测试中的数据库初始化和关闭逻辑 ([d18d152](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d18d152))


### 🐛 Bug 修复

* **tasks:** 修复删除任务的多条件支持 ([a8ee9be](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a8ee9be))
* **utils:** 修复 RSS 时间处理逻辑 ([316780d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/316780d))
* **utils:** 添加 RSS 文章发布时间验证 ([f7a9342](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f7a9342))
* 优化 移除过时的文章 的性能 ([dfc2450](https://github.com/CaoMeiYouRen/rss-impact-server/commit/dfc2450)), closes [#468](https://github.com/CaoMeiYouRen/rss-impact-server/issues/468)

## [1.14.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.14.0...v1.14.1) (2024-12-14)


### 🐛 Bug 修复

* 添加 splat 格式支持；添加 VACUUM 任务日志 ([35b7f53](https://github.com/CaoMeiYouRen/rss-impact-server/commit/35b7f53))

# [1.14.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.13.0...v1.14.0) (2024-12-07)


### ✨ 新功能

* update connect-redis to version 8.0.0; update RedisStore import statement ([09f0c4b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/09f0c4b))

# [1.13.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.12.0...v1.13.0) (2024-11-30)


### ✨ 新功能

* **db:** add acl crud field to daily count entity ([7b28074](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7b28074))


### 🐛 Bug 修复

* **tasks:** 修复每日统计数据更新逻辑 ([f3dbd62](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f3dbd62))
* 修复每日统计数据更新逻辑；添加 rawDate 字段 ([27b649c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/27b649c))

# [1.12.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.11.0...v1.12.0) (2024-11-23)


### ♻ 代码重构

* **daily-count:** 添加新的统计字段 ([3f20077](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3f20077))
* **db:** 优化 feed 实体的验证逻辑 ([2b5b72e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2b5b72e))
* **notification:** 优化通知功能 ([909b049](https://github.com/CaoMeiYouRen/rss-impact-server/commit/909b049))
* **tasks:** 优化每日统计数据更新逻辑 ([6687504](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6687504))
* 优化 DISABLE_EMPTY_FEEDS 配置提示 ([355052b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/355052b))
* 优化 部分情况下 dicData 的查询条数 ([bf81783](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bf81783))
* 优化分类实体验证逻辑；升级 nodejs 最低版本为 20 ([14f7f58](https://github.com/CaoMeiYouRen/rss-impact-server/commit/14f7f58))


### ✨ 新功能

* **daily-count:** 添加重新统计接口；优化每日统计逻辑 ([b051ad4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b051ad4))
* 更新 push-all-in-one 版本至 4.1.1；移除不再使用的依赖项；更新接口定义以匹配新版本；优化推送工具函数 ([d689a7f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d689a7f)), closes [#459](https://github.com/CaoMeiYouRen/rss-impact-server/issues/459)


### 🐛 Bug 修复

* **tasks:** 修复每日统计数据更新逻辑 ([65f1d3c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/65f1d3c))
* 修复 查询全部 的自定义查询会被错误禁用的 bug ([bf1c563](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bf1c563))
* 修复 禁用空订阅 逻辑错误 ([865a875](https://github.com/CaoMeiYouRen/rss-impact-server/commit/865a875))
* 修复 禁用空订阅 逻辑错误 ([3a96aef](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3a96aef))
* 修复 自定义查询为分类时，会错误禁用的问题 ([6b058ed](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6b058ed))

# [1.11.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.10.0...v1.11.0) (2024-11-16)


### ♻ 代码重构

* 优化 删除日志和订阅的逻辑 ([264773a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/264773a))
* 优化 删除过时的文章 为队列 ([dc53047](https://github.com/CaoMeiYouRen/rss-impact-server/commit/dc53047))
* 优化 部分定时任务触发时间；修改删除文章和日志的逻辑；增加 CQImage 注释 ([5ede09f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5ede09f))
* 修改 部分定时任务的执行时间 ([ec291ab](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ec291ab))


### ✨ 新功能

* 新增 禁用空订阅接口；优化 VACUUM 逻辑；移除部分未使用的代码 ([12b0ed5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/12b0ed5))
* 新增 默认禁用不包含任何 Hook 和 自定义查询的订阅 ([807ea36](https://github.com/CaoMeiYouRen/rss-impact-server/commit/807ea36)), closes [#467](https://github.com/CaoMeiYouRen/rss-impact-server/issues/467)

# [1.10.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.9.0...v1.10.0) (2024-11-09)


### ♻ 代码重构

* 修改 auth0 默认的用户名设定 ([c797d1f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c797d1f))
* 修改 getConditions 逻辑；修改相关测试用例 ([f767650](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f767650))
* 新增 git commit hash 输出 ([6f82b22](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6f82b22)), closes [#440](https://github.com/CaoMeiYouRen/rss-impact-server/issues/440)
* 订阅获取成功时，清空错误计数 ([19c87bc](https://github.com/CaoMeiYouRen/rss-impact-server/commit/19c87bc))


### ✨ 新功能

* 新增 最大错误次数 配置，自动禁用错误次数过多的订阅 ([9c59f92](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9c59f92))
* 新增 构建信息 输出 ([2b26cd4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2b26cd4))


### 🐛 Bug 修复

* 修复 oidc 未初始化时的 logout ([5dad474](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5dad474))
* 修复 推送时存在多余的换行符的问题 ([383e858](https://github.com/CaoMeiYouRen/rss-impact-server/commit/383e858))
* 修复 禁用订阅后未移除定时任务的问题 ([bdf728a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bdf728a))
* 修复 邮箱校验逻辑错误 ([166873e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/166873e))
* 修复 部分情况不按照 id 排序的问题 ([1045a37](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1045a37))

# [1.9.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.8.0...v1.9.0) (2024-11-02)


### ♻ 代码重构

* 优化 user 的 roles 字段的选项 ([f065463](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f065463))
* 修改 demo 账号的验证逻辑 ([0d0fd5b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0d0fd5b))
* 修改 邮箱校验逻辑 ([b7b3928](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b7b3928))
* 增加 demo 账号，以方便用户体验 ([406e1a6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/406e1a6)), closes [#434](https://github.com/CaoMeiYouRen/rss-impact-server/issues/434)
* 增加日志压缩、自动删除日志、日志级别设置 ([c3d378b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c3d378b))


### ✨ 新功能

* 新增 用户邮箱校验 ([edf3e5d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/edf3e5d))


### 🐛 Bug 修复

* 修复 @nestjs/swagger 版本更新导致 nestjs 无法启动的问题 ([6d2faf8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6d2faf8))
* 修复 demo 账号的密码过短导致无法登录的问题 ([cafb088](https://github.com/CaoMeiYouRen/rss-impact-server/commit/cafb088))
* 修复 登出时未处理 oidc 登出的问题 ([3917a3a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3917a3a))
* 修复 自定义查询 未设置 user 的问题 ([19cf2dd](https://github.com/CaoMeiYouRen/rss-impact-server/commit/19cf2dd))
* 修复 获取 RSS 时，可能会获取到过时的内容的问题 ([2687afa](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2687afa))
* 修复 通过  OPML 文件导入的订阅的默认轮询时间错误 ([4ecb328](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4ecb328))
* 修改通过 docker 部署时的默认跨域配置 ([93137f1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/93137f1))

# [1.8.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.7.0...v1.8.0) (2024-10-26)


### ♻ 代码重构

* 前端增加百度统计 ([e78e897](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e78e897))
* 增加 Server 酱³ 推送 ([d61b929](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d61b929))


### ✨ 新功能

* 新增 过滤链接 配置 ([0ebaa81](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0ebaa81))

# [1.7.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.6.1...v1.7.0) (2024-10-19)


### ♻ 代码重构

* 优化 auth0 登录时增加 state ([d4afbb3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d4afbb3))
* 优化 用户管理和个人信息页面 ([b8b0b49](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b8b0b49))
* 优化超长文本分割，修复文本断句问题 ([f9dad15](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f9dad15)), closes [#329](https://github.com/CaoMeiYouRen/rss-impact-server/issues/329)


### ✨ 新功能

* 增加 auth0 登录/注册 功能 ([e5b3c9a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e5b3c9a))
* 增加 禁用账号密码登录/注册 配置项 ([bee55b0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bee55b0))


### 🐛 Bug 修复

* 修复 auth0 未初始化时，nest 启动失败的问题 ([5bed6bf](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5bed6bf))
* 修复 禁用登录注册的逻辑错误 ([cedf805](https://github.com/CaoMeiYouRen/rss-impact-server/commit/cedf805))
* 修复 缺少 Auth0 配置字段的问题 ([b8fd5f5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b8fd5f5))

## [1.6.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.6.0...v1.6.1) (2024-10-12)


### ♻ 代码重构

* 优化 Origin 的判断 ([62cac73](https://github.com/CaoMeiYouRen/rss-impact-server/commit/62cac73))
* 暂时移除 helmet ([3949bb7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3949bb7))


### 🐛 Bug 修复

* 修复 cookie 设置问题 ([9612940](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9612940))
* 修复 跨域请求头中包含未允许的字段 ([7ea2c5c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7ea2c5c))
* 修复 部分情况下 cookie 无法跨域的问题 ([326f0f5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/326f0f5))

# [1.6.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.5.3...v1.6.0) (2024-10-05)


### ♻ 代码重构

* 增加 CronJob 配置环境变量 ([c10e961](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c10e961))


### ✨ 新功能

* 新增 Sentry 配置 ([2b58003](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2b58003))


### 🐛 Bug 修复

* 修复 部分情况下缺少 Origin 判断的问题 ([9329912](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9329912))

## [1.5.3](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.5.2...v1.5.3) (2024-09-28)


### 🐛 Bug 修复

* 修复 Article 的 enclosureLength 字段类型改为 bigint，最大值调整为 Number.MAX_SAFE_INTEGER ([b9f1b3f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b9f1b3f))
* 修复 附件大小的范围过小的问题 ([6ca85eb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6ca85eb)), closes [#357](https://github.com/CaoMeiYouRen/rss-impact-server/issues/357)

## [1.5.2](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.5.1...v1.5.2) (2024-09-21)


### ♻ 代码重构

* 优化 全文抓取失败的逻辑 ([606ee66](https://github.com/CaoMeiYouRen/rss-impact-server/commit/606ee66)), closes [#325](https://github.com/CaoMeiYouRen/rss-impact-server/issues/325)
* 优化 单个订阅增加最大文章数量限制 ([db9a73b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/db9a73b)), closes [#324](https://github.com/CaoMeiYouRen/rss-impact-server/issues/324)
* 增加 手动调用 sqlite VACUUM 命令的接口 ([893d080](https://github.com/CaoMeiYouRen/rss-impact-server/commit/893d080))
* 添加 数据库查询日志 ([9cd6842](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9cd6842))
* 重构 修改查询数据库信息逻辑，改为使用 TypeORM DataSource ([87980be](https://github.com/CaoMeiYouRen/rss-impact-server/commit/87980be))


### 🐛 Bug 修复

* 修复 sqlite 不会自动释放未使用的空间的 bug；重构 sqlite 查询和执行相关逻辑 ([0cbb286](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0cbb286))
* 修复 删除超过限制的文章数量逻辑错误的 bug ([2f9e131](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2f9e131))
* 修复 在非严格模式下，Cookie 无法跨域的问题 ([12a945d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/12a945d)), closes [#334](https://github.com/CaoMeiYouRen/rss-impact-server/issues/334)
* 修复 字符编码为 utf8mb4 时，MySQL 无法创建索引的问题；更新了 MySQL 相关文档 ([a64fbd5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a64fbd5))
* 修复 队列中存在未捕获的错误 ([fd77a71](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fd77a71)), closes [#312](https://github.com/CaoMeiYouRen/rss-impact-server/issues/312)

## [1.5.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.5.0...v1.5.1) (2024-09-14)


### ♻ 代码重构

* 优化 增加了 SSL 连接选项 ([15538a6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/15538a6))
* 回退 postgres 的 id 为 integer 类型 ([ea0153d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ea0153d))
* 重构 TasksService 和 helper；更新 订阅 队列逻辑；增加 Hook 队列执行优先级 ([91b8c46](https://github.com/CaoMeiYouRen/rss-impact-server/commit/91b8c46))
* 重构 删除 Base 实体中的不必要的日志；将 TasksService 中的 setTimeout 更改为 bitTorrentQueue ([156b363](https://github.com/CaoMeiYouRen/rss-impact-server/commit/156b363))
* 重构 队列增加超时时间；bitTorrentHook 增加优先级设置 ([07bed83](https://github.com/CaoMeiYouRen/rss-impact-server/commit/07bed83))


### 🐛 Bug 修复

* 修复 Resource 部分字段不能为 null 的 bug ([542c5ec](https://github.com/CaoMeiYouRen/rss-impact-server/commit/542c5ec))
* 处理部分情况下，postgres 数据库的兼容性问题；更新文档 ([059b2a4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/059b2a4))

# [1.5.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.4.2...v1.5.0) (2024-09-07)


### ♻ 代码重构

* 优化 数据库信息查询；增加 postgres 数据库信息返回 ([8f8a9b4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8f8a9b4))
* 更新 AIConfig 默认值；TasksService 使用新的配置值 ([6839fac](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6839fac))
* 更新 Article 实体设置类别的默认值，更新 TasksService 中的 lodash 导入，修改错误消息和类别分配逻辑 ([fdbfd8a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fdbfd8a))
* 更新了 ACL CRUD 控制器以使用 CrudQuery，添加了分页和选择选项，并对 WebhookLogController 和 ACL CRUD 装饰器进行了细微更改 ([7119663](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7119663))
* 添加新常量 IS_ID，更新装饰器逻辑 ([57362d8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/57362d8))
* 重构 Column 装饰器到 CustomColumn 装饰器；优化数据表字段定义 ([39b6f53](https://github.com/CaoMeiYouRen/rss-impact-server/commit/39b6f53))
* 重构 CustomColumn 装饰器逻辑 ([2ea53b2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2ea53b2))
* 重构 使用 p-queue 替代 p-limit 来优化并发逻辑 ([f277651](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f277651)), closes [#293](https://github.com/CaoMeiYouRen/rss-impact-server/issues/293)
* 重构 数据表同步逻辑；更新数据库配置文档 ([1654dc8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1654dc8))
* 重构 迁移 mysql 驱动到 mysql2；增加 mysql 数据库信息输出 ([e3a6cf8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e3a6cf8))


### ✨ 新功能

* 优化 将 id 字段升级为 bigint 类型 ([24fd213](https://github.com/CaoMeiYouRen/rss-impact-server/commit/24fd213)), closes [#270](https://github.com/CaoMeiYouRen/rss-impact-server/issues/270)
* 新增 AI 生成/翻译 RSS 分类 功能 ([fcd7adb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fcd7adb))
* 新增 Webhook 和通知日志增加关联的文章 ([825115e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/825115e)), closes [#251](https://github.com/CaoMeiYouRen/rss-impact-server/issues/251)


### 🐛 Bug 修复

* 优化 URL 相关的装饰器逻辑 ([adf7637](https://github.com/CaoMeiYouRen/rss-impact-server/commit/adf7637))
* 修复 accessToken 不能为空的问题 ([17ba8a8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/17ba8a8))
* 修复 CacheService 的缓存 key 错误 ([31feb1c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/31feb1c))
* 修复 id 类型的字段逻辑处理 ([994de52](https://github.com/CaoMeiYouRen/rss-impact-server/commit/994de52))
* 修复 MySQL 字段兼容性问题 ([93629e7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/93629e7))
* 修复 自定义查询中过时的 feed 字段 ([0c541c0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0c541c0))

## [1.4.2](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.4.1...v1.4.2) (2024-08-31)


### ♻ 代码重构

* 优化 turndown 对 html 字符的处理 ([b14155a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b14155a)), closes [#287](https://github.com/CaoMeiYouRen/rss-impact-server/issues/287)


### 🐛 Bug 修复

* 优化 admin 用户可按所属用户查询数据 ([3c5e8d4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3c5e8d4))
* 修复 OpenAI 的 max_tokens 相关逻辑的错误 ([d742248](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d742248)), closes [#290](https://github.com/CaoMeiYouRen/rss-impact-server/issues/290)
* 修复 抓取全文时，未更新 纯文本格式的 bug ([1b71910](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1b71910))

## [1.4.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.4.0...v1.4.1) (2024-08-24)


### 🐛 Bug 修复

* 新增 CustomColumn 装饰器 ([7ad9797](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7ad9797))

# [1.4.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.3.1...v1.4.0) (2024-08-17)


### ✨ 新功能

* 新增 MySQL 支持 ([70f1fa2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/70f1fa2))
* 新增 Postgres 连接支持 ([7567dbf](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7567dbf))

## [1.3.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.3.0...v1.3.1) (2024-08-10)


### 🐛 Bug 修复

* 修改 id 判断范围 ([c218d52](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c218d52))

# [1.3.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.2.1...v1.3.0) (2024-08-03)


### ✨ 新功能

* 新增 抓取网页全文 功能 ([2ac6492](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2ac6492))


### 🐛 Bug 修复

* 修复 @postlight/parser 依赖的问题 ([88c0b4f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/88c0b4f))
* 修复 OneBot 推送渠道存在多余的引号的 bug ([355683e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/355683e))
* 修复 是否抓取全文为必填的 bug ([96e598b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/96e598b))
* 修复 部分情况下标题和内容重复判断错误的 bug ([04c9ff6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/04c9ff6))

## [1.2.1](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.2.0...v1.2.1) (2024-07-27)


### ✅ 测试

* 修复 mdToCqcode 逻辑改动后的测试用例失败 ([89f8a31](https://github.com/CaoMeiYouRen/rss-impact-server/commit/89f8a31))


### 🐛 Bug 修复

* 优化 CQ 码的转义 ([3f75be5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3f75be5))
* 修复 mdToCqcode 逻辑改动导致的测试用例错误 ([3702534](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3702534))
* 修复 OneBot 推送渠道的 CQCode 解析问题；修复 husky 路径问题 ([0c1c376](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0c1c376))
* 修复 push-all-in-one 的 onebot 推送渠道无法解析 CQ 码的问题；修复图片发送失败的问题 ([a6997ab](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a6997ab))

# [1.2.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.1.0...v1.2.0) (2024-07-13)


### ♻ 代码重构

* 优化 log 的 dataFormat ([ac376ef](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ac376ef))


### ✨ 新功能

* 新增 当 bt 服务器的磁盘空间不足时，自动删除文件功能 ([192114e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/192114e))


### 🐛 Bug 修复

* 修复 removeTorrent 未删除文件的 bug；优化 查询 Torrent 列表的逻辑 ([d9f1671](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d9f1671))
* 修复 前后端不在同一个域名下的跨域问题 ([c3f749d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c3f749d)), closes [#188](https://github.com/CaoMeiYouRen/rss-impact-server/issues/188)
* 修改 bt 服务器磁盘空间不足时的逻辑 ([bb6477c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bb6477c))

# [1.1.0](https://github.com/CaoMeiYouRen/rss-impact-server/compare/v1.0.0...v1.1.0) (2024-06-29)


### ♻ 代码重构

* 优化 session 配置 ([3dd9d79](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3dd9d79))


### ✨ 新功能

* 新增 文章数等数据的统计 ([32fab34](https://github.com/CaoMeiYouRen/rss-impact-server/commit/32fab34))


### 🐛 Bug 修复

* 修复 日志存在重复的问题 ([b8996b2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b8996b2))
* 修复 统计数据存在重复的问题；修复 DailyCount 接口的 bug ([960c2f1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/960c2f1))

# 1.0.0 (2024-06-15)


### ♻ 代码重构

* updateTorrentInfo 的错误信息增加更多上下文 ([87c6916](https://github.com/CaoMeiYouRen/rss-impact-server/commit/87c6916))
* 优化 AI 总结推送的重试逻辑 ([33d832b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/33d832b))
* 优化 BT 解析的逻辑；优化 AI 总结日志 ([f8b8ebb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f8b8ebb))
* 优化 Date 类型字段的处理和数据库存储 ([e7f53f0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e7f53f0))
* 优化 retry 相关逻辑 ([5602ac8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5602ac8))
* 优化 session 相关逻辑 ([8e1bd7c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8e1bd7c))
* 优化 typeorm 相关代码；迁移到 @nestjs/typeorm ([aab6566](https://github.com/CaoMeiYouRen/rss-impact-server/commit/aab6566))
* 优化 删除 bitTorrent 相关逻辑 ([d3b7b8e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d3b7b8e))
* 优化 开发环境的日志输出 ([1123d0d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1123d0d))
* 优化 日志逻辑 ([76d53fd](https://github.com/CaoMeiYouRen/rss-impact-server/commit/76d53fd))
* 优化 未分类项的逻辑；优化 快速订阅时的分类选项；修复 分类和分组的差异 ([624982c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/624982c))
* 优化 生产环境下静态文件的日志 ([3f6b22e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3f6b22e))
* 优化 统一错误日志输出路径 ([4b4f278](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4b4f278))
* 优化 缓存逻辑，抽离缓存函数 ([ae9e54f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ae9e54f))
* 优化 部分代码对时间值的处理 ([fc45752](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fc45752))
* 优化自定义查询的分组查询 ([111781e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/111781e))
* 全面替换 ValidateIf 为 IsOptional ([609bd97](https://github.com/CaoMeiYouRen/rss-impact-server/commit/609bd97))
* 全面迁移 enclosure 相关逻辑 ([99f23b0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/99f23b0))
* 初步重构 enclosure 相关逻辑；优化 enclosure 查询；优化 列表宽度 ([0e21c8e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0e21c8e))
* 增加一些日志输出 ([25af20c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/25af20c))
* 新增 better-bytes 包；修改 dataFormat 的实现 ([edf098d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/edf098d))
* 日志文件禁用 zip 压缩 ([a2b243c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a2b243c))
* 更改 history 中间件位置；移除部分未使用的代码 ([4a6d69b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4a6d69b))
* 更改缓存逻辑 ([800053a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/800053a))
* 考虑添加代理配置；优化 limiter 相关逻辑 ([fd7e476](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fd7e476))
* 重构 BT 下载逻辑 ([ce3b2bc](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ce3b2bc))
* 重构 bt 解析相关逻辑 ([93934ba](https://github.com/CaoMeiYouRen/rss-impact-server/commit/93934ba))
* 重构 日志逻辑；迁移 日志到 winston ([915e53c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/915e53c))
* 重构 过滤条件 和 排除条件的逻辑 ([f300f29](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f300f29))


### ✨ 新功能

* aI 总结增加 分段总结功能 ([5f5ce1f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5f5ce1f))
* 优化 bt 资源解析逻辑；修改 url 判断/校验逻辑 ([bf7eecc](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bf7eecc))
* 优化 Hook 配置相关类型 ([2b7f3c2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2b7f3c2))
* 优化 Hook 配置相关逻辑，实现动态配置表单；优化 Hook 相关类型声明 ([7e1ce0d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7e1ce0d))
* 优化 ID 的验证；优化 关联关系 ([21e47a0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/21e47a0))
* 优化 limit 相关逻辑，增加全局 hook limit 限制，优化具体类型的 hook limit 限制 ([4b82b07](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4b82b07))
* 优化 OneBot 对 markdown 的支持；移除部分无用代码；修复构建问题 ([125c0d5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/125c0d5))
* 优化 反转触发逻辑 和 推送通知逻辑 ([286502e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/286502e))
* 优化 子表单 字段生成；优化 user 和 userId ([f67ebaf](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f67ebaf))
* 优化 字节体积支持从字符串解析 ([19c591a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/19c591a))
* 优化 更新前校验逻辑；增加 更新附件大小 逻辑；增加 mdToCqcode/dataFormat 测试用例；修复 app 未 close 的问题 ([bd00579](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bd00579))
* 优化 自定义查询支持多选订阅 ([40b34d3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/40b34d3))
* 优化 资源文件删除逻辑；优化 推送模块逻辑 ([ed765b9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ed765b9))
* 优化：同一个用户禁止创建相同 name 的分类 ([ed1a836](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ed1a836))
* 优化资源下载和存储逻辑 ([2ce9263](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2ce9263))
* 修复 swagger 文档中缺失返回值类型的问题；修复 全局 api 前缀问题 ([ecd2445](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ecd2445))
* 修复 查询逻辑；完善查询字段 ([62c684d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/62c684d))
* 修复 附件字段的展示；优化 Hook 列表、订阅链接、附件 等字段的更新 ([e4f11c1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e4f11c1))
* 初步完全登录 和 session 模块 ([fe90518](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fe90518))
* 初步完成 ACL CRUD 路由的设计 ([5a95c55](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5a95c55))
* 初步完成 Hook 模块的设计；修复 多对多关系问题；优化 过滤条件 ([89f5683](https://github.com/CaoMeiYouRen/rss-impact-server/commit/89f5683))
* 初步完成 RSS 订阅表 和 分组表的设计 ([7d377aa](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7d377aa))
* 初步完成登录功能；修改部分文件的命名风格 ([5750be1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5750be1))
* 初步解决 CRUD 路由的 config；优化 用户管理路由 ([861552c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/861552c))
* 反转触发增加频率限制 ([8f9e9b2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8f9e9b2))
* 增加 快速添加订阅 功能；修复 封面 URL 字段校验；优化 部分字段初始化逻辑 ([e230c67](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e230c67))
* 增加 文章表的设计 ([b634ba7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b634ba7))
* 增加 注册逻辑；优化 data 文件夹初始化 ([de072a8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/de072a8))
* 增加 静态资源路径 ([e9cbeaf](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e9cbeaf))
* 增加数据库用量统计 ([337839c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/337839c))
* 增加登出功能；优化 Session 类型声明 ([ea69161](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ea69161))
* 增加系统信息相关接口 ([5cd4fc6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5cd4fc6))
* 增加重置密码功能 ([2a713f9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2a713f9))
* 完善 accessToken 相关逻辑 ([84063c2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/84063c2))
* 完善 ACL CRUD 路由逻辑；增加 feed 相关逻辑 ([7e350fb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7e350fb))
* 完善 dicData 相关逻辑；修复 部分字段的显示；优化 relations 关系 ([35b9964](https://github.com/CaoMeiYouRen/rss-impact-server/commit/35b9964))
* 完善 管理员账号初始化；完善权限管理系统 ([9c38e16](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9c38e16))
* 完成 数据库的对接和用户表设计 ([468d149](https://github.com/CaoMeiYouRen/rss-impact-server/commit/468d149))
* 实现 RSS 订阅功能；修改 文章模型的字段；增加 工具类函数 ([30dafa8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/30dafa8))
* 实现 文件下载 Hook；新增 文件资源管理路由；修复 guid 错误 ([89aabf3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/89aabf3))
* 推送通知添加代理配置 ([fb41b2e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fb41b2e))
* 新增 AI 大模型 Hook ([34c9ffb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/34c9ffb))
* 新增 AI 总结输出功能 ([9769293](https://github.com/CaoMeiYouRen/rss-impact-server/commit/9769293))
* 新增 bitTorrent 下载相关功能；优化 hook 触发逻辑；修复 qbittorrent 在 cjs 的支持问题 ([b8acc51](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b8acc51))
* 新增 Hook 相关数据表设计；增加 json 字符串长度校验；增加 Hook 管理 路由 ([be7194c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/be7194c))
* 新增 push-all-in-one 推送功能; 新增 安全正整数校验 ([ee37d62](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ee37d62))
* 新增 webhook 触发逻辑 ([7f27b7f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7f27b7f))
* 新增 webhook-log 路由 ([71ab5cb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/71ab5cb))
* 新增 个人信息 表单相关逻辑 ([1fc4a9a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1fc4a9a))
* 新增 个人信息修改接口 ([68f54cf](https://github.com/CaoMeiYouRen/rss-impact-server/commit/68f54cf))
* 新增 从 OPML 文件导入订阅 功能 ([cf1b453](https://github.com/CaoMeiYouRen/rss-impact-server/commit/cf1b453))
* 新增 分组管理 数据字典；文章管理 禁用 创建和更新；增加 部分 description ([a39cde5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a39cde5))
* 新增 导出订阅为 OPML 文件 功能 ([a353620](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a353620))
* 新增 按 订阅、分组 输出 RSS 的功能 ([ab05fa8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ab05fa8))
* 新增 插入前 和 更新前校验 ([1dabbb7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1dabbb7))
* 新增 支持 推送 AI 总结 ([72065bd](https://github.com/CaoMeiYouRen/rss-impact-server/commit/72065bd))
* 新增 支持过滤/排除正文；新增 正文查询 ([8bdc259](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8bdc259))
* 新增 文章、日志、资源等的定期清理 ([762711e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/762711e))
* 新增 正则替换 Hook ([5c675fc](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5c675fc))
* 新增 自定义 rss 查询输出 ([57728f9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/57728f9))
* 新增 自定义查询功能 ([066dee1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/066dee1))
* 新增 自定义查询配置 ([b4d06af](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b4d06af))
* 新增 附件过滤排除选项 ([6dec745](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6dec745))
* 新增：ajax 添加代理配置功能 ([b94e13c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b94e13c))
* 新增：在请求 RSS URL 时添加请求代理；在下载文件时添加代理；在下载种子时添加代理 ([10440fa](https://github.com/CaoMeiYouRen/rss-impact-server/commit/10440fa))
* 自定义查询增加缓存功能 ([00a556b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/00a556b))
* 订阅增加重试次数 ([eef61a4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/eef61a4))


### 🐛 Bug 修复

* bitTorrent 增加 并发限制 ([7c92a22](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7c92a22))
* rSS 轮询时间最小值改为 5 分钟 ([e61f9ae](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e61f9ae))
* 优化 AI 大模型相关的描述 ([94b7ea6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/94b7ea6))
* 优化 AI 总结推送相关逻辑 ([169d1f4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/169d1f4))
* 优化 AI 总结的输出 ([4d546c2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4d546c2))
* 优化 AI 请求的并发 ([421314f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/421314f))
* 优化 Article 按 enclosureType 查询的逻辑 ([7a6e7d3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7a6e7d3))
* 优化 avue 相关类型声明 ([37b259a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/37b259a))
* 优化 bitTorrentHook 相关逻辑；调整 hook 条数限制；调整 资源文件状态；调整 安全整数/正整数 校验逻辑 ([11e7449](https://github.com/CaoMeiYouRen/rss-impact-server/commit/11e7449))
* 优化 bt 文件大小解析；优化 bt 资源状态 ([370bc9c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/370bc9c))
* 优化 bt 服务器的磁盘空间不足 时的逻辑 ([85dba94](https://github.com/CaoMeiYouRen/rss-impact-server/commit/85dba94))
* 优化 BT 资源大小解析 ([19880d1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/19880d1))
* 优化 Hook 配置选项的校验 ([b03233a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b03233a))
* 优化 http 日志处理；新增 requestId 来追踪请求 ([baff297](https://github.com/CaoMeiYouRen/rss-impact-server/commit/baff297))
* 优化 nullable 字段的处理 ([0033a70](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0033a70))
* 优化 proxyConfig 配置 ([ef96ffb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ef96ffb))
* 优化 removeFile 逻辑 ([7d20e0e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7d20e0e))
* 优化 最大下载并发数 逻辑；新增 filterout 逻辑 ([6d2842d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6d2842d))
* 优化 对 enclosure url 的校验；修复 部分情况下 url 不规范的问题 ([301775e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/301775e))
* 优化 快速添加订阅 RSS 相关逻辑 ([cccc9a4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/cccc9a4))
* 优化 推送 Hook 支持仅推送摘要 ([6b6705e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6b6705e))
* 优化 数据库同步逻辑 ([b269aa1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b269aa1))
* 优化 数据库文件固定同步 ([e4083d6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e4083d6))
* 优化 文件下载逻辑；优化资源管理 ([3279a53](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3279a53))
* 优化 文章 附件的文件体积显示 ([03a7847](https://github.com/CaoMeiYouRen/rss-impact-server/commit/03a7847))
* 优化 日志输出；增加 demo 站的部署；增加 container_name ([e17c8d5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e17c8d5))
* 优化 时间格式化函数 ([b5c76c2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b5c76c2))
* 优化 格式化流量数据 对小于 0 的判断 ([ef857a4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ef857a4))
* 优化 资源存储逻辑；修复 bitTorrentHook 缺失 userId 的问题 ([1937fb0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1937fb0))
* 优化 资源文件的大小显示 ([c4e3d4e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c4e3d4e))
* 优化 过滤附件体积 支持从字符串解析 ([192420a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/192420a))
* 优化 部分字段的 标签 ([abb7cc1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/abb7cc1))
* 优化 部分字段的显隐；优化 user 字典 ([a93be9d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a93be9d))
* 优化 部分情况下，对 bittorrent 类型 enclosure 的处理 ([dbd70f1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/dbd70f1))
* 优化 部分情况下未设置 description 的问题 ([db837c3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/db837c3))
* 优化 部分情况下未设置 imageUrl 的问题 ([4b9f206](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4b9f206))
* 优化 限流器增加 redis store 支持 ([87f83b9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/87f83b9))
* 优化：session 增加 redis store 支持 ([75106b2](https://github.com/CaoMeiYouRen/rss-impact-server/commit/75106b2))
* 优化：当 推送内容过长时，分割推送 ([ec80e38](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ec80e38))
* 优化自定义查询在更新后的缓存逻辑 ([91eec60](https://github.com/CaoMeiYouRen/rss-impact-server/commit/91eec60))
* 修复 /api 路由在部分情况下会回退的问题；优化 rss/atom 格式的输出 ([b40ede4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b40ede4))
* 修复 AI 总结功能的部分 bug ([391c96e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/391c96e))
* 修复 bt 元数据解析问题；更改 分类管理 为 分组管理 ([d43aa62](https://github.com/CaoMeiYouRen/rss-impact-server/commit/d43aa62))
* 修复 bt 资源状态的问题 ([6035689](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6035689))
* 修复 crypto-hash 版本问题 ([072670b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/072670b))
* 修复 data 文件夹不存在的情况 ([2947a1b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2947a1b))
* 修复 docker 构建问题 ([5724b25](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5724b25))
* 修复 enclosure 不是实体类的问题；优化 推送标题与正文重复的问题；优化 http 日志 ([1ac6a5a](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1ac6a5a))
* 修复 enclosure 相关函数；修复 enclosure 相关测试用例 ([60b7cd3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/60b7cd3))
* 修复 enclosure 过滤的逻辑问题 ([e041faf](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e041faf))
* 修复 ERR_ERL_PERMISSIVE_TRUST_PROXY 问题 ([00adb3e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/00adb3e))
* 修复 example 中 Date 不固定的问题；优化 swagger 文档的 operationId；修复登录接口缺少返回值类型的问题 ([e71a0d1](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e71a0d1))
* 修复 feeds 字段无法查询的问题 ([8a29a78](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8a29a78))
* 修复 Magnet 丢失 URL 的问题 ([8843d29](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8843d29))
* 修复 nullable bug ([b519030](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b519030))
* 修复 OPML 文件 导入导出功能存在的部分问题；修复导出文件的编码问题 ([63b298f](https://github.com/CaoMeiYouRen/rss-impact-server/commit/63b298f))
* 修复 repo name 和 hash 错误 ([cdb5d04](https://github.com/CaoMeiYouRen/rss-impact-server/commit/cdb5d04))
* 修复 retryBackoff 的错误不会抛出的问题 ([468068d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/468068d))
* 修复 RSS 订阅存在重复 URL 的问题 ([632d91d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/632d91d))
* 修复 session 不存在时的登出逻辑 ([c4424ae](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c4424ae))
* 修复 session 引起的 sqlite 错误 ([27b404e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/27b404e))
* 修复 url 分割错误 ([ec16cd6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ec16cd6))
* 修复 url 和 img 类型的字段问题 ([c5611f5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c5611f5))
* 修复 WebhookLog 的响应体和响应头长度不够的问题 ([11bc912](https://github.com/CaoMeiYouRen/rss-impact-server/commit/11bc912))
* 修复 不同源的相同资源缺少 size 的问题 ([ad8f788](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ad8f788))
* 修复 代理配置在部分情况下未加载的问题 ([7582dbc](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7582dbc))
* 修复 反转触发 Hook 的逻辑 ([afd2183](https://github.com/CaoMeiYouRen/rss-impact-server/commit/afd2183))
* 修复 处理跨域/防盗链问题 ([2e42d48](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2e42d48))
* 修复 多余的 dicData；优化 资源按类型查询；优化 Hook 过滤/排除选项；优化 select 的校验 ([b9d1966](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b9d1966))
* 修复 排除逻辑的错误 ([31d7d44](https://github.com/CaoMeiYouRen/rss-impact-server/commit/31d7d44))
* 修复 支持多个订阅的更改 ([45104fa](https://github.com/CaoMeiYouRen/rss-impact-server/commit/45104fa))
* 修复 日志时间格式化未使用 24 小时制的问题 ([0d940a5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0d940a5))
* 修复 日期格式化问题；优化 字段排序 ([7cc5716](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7cc5716))
* 修复 标题和内容之间的换行符问题 ([f805ad8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f805ad8))
* 修复 测试用例错误 ([2bee523](https://github.com/CaoMeiYouRen/rss-impact-server/commit/2bee523))
* 修复 特定情况下包含链接的请求会推送失败 ([c06179e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c06179e))
* 修复 移除文件逻辑 ([7ccc5be](https://github.com/CaoMeiYouRen/rss-impact-server/commit/7ccc5be))
* 修复 自定义查询更新错误 ([1510745](https://github.com/CaoMeiYouRen/rss-impact-server/commit/1510745))
* 修复 自定义查询的权限问题 ([24c78e4](https://github.com/CaoMeiYouRen/rss-impact-server/commit/24c78e4))
* 修复 自定义查询输出缺少分类的 bug ([3389dfe](https://github.com/CaoMeiYouRen/rss-impact-server/commit/3389dfe))
* 修复 订阅 id 不能设置为 null 的问题；优化访问秘钥的设置 ([76e5bbb](https://github.com/CaoMeiYouRen/rss-impact-server/commit/76e5bbb))
* 修复 订阅在启用和禁用时未更新定时任务的 bug ([ad04b32](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ad04b32))
* 修复 订阅的简介有可能为空的 bug ([4db8d3e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/4db8d3e))
* 修复 部分关联关系错误；修复 获取 RSS 的去重错误；修复 部分情况下 guid 不存在的问题；修复 部分情况下 author/categories 字段不存在的问题 ([c9921b3](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c9921b3))
* 修复 部分分组和分类错误 ([58013db](https://github.com/CaoMeiYouRen/rss-impact-server/commit/58013db))
* 修复 部分情况下 proxyConfig 字段为 null 的问题 ([e08103c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e08103c))
* 修复 部分情况下 size 会小于 0 的 bug ([8f12731](https://github.com/CaoMeiYouRen/rss-impact-server/commit/8f12731))
* 修复 部分情况下 无法正确解析 magnet size 的问题 ([fdd2333](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fdd2333))
* 修复 部分情况下，对 bt 资源状态判断错误的问题 ([25cdb69](https://github.com/CaoMeiYouRen/rss-impact-server/commit/25cdb69))
* 修复 部分情况下代理无法设置为 空的问题 ([6d7a3f8](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6d7a3f8))
* 修复 部分情况下子字段无法校验的问题 ([b2838b7](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b2838b7))
* 修复 部分情况下的错误日志输出 ([32e3f5e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/32e3f5e))
* 修复 部分情况下缺失 mediaContent 的问题；优化 Feed 与 Hook 的查询逻辑 ([ec320f9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/ec320f9))
* 修复 部分情况下资源下载路径 不存在的问题 ([fca75df](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fca75df))
* 修复单页应用程序(SPA)重定向问题 ([f4c708c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/f4c708c))
* 修复部分情况下的代理配置失效 ([bbccb24](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bbccb24))
* 修改 分组 为 分类 ([93a9583](https://github.com/CaoMeiYouRen/rss-impact-server/commit/93a9583))
* 修改 时区为 Asia/Shanghai ([055b6ad](https://github.com/CaoMeiYouRen/rss-impact-server/commit/055b6ad))
* 升级 pnpm 版本 ([a892999](https://github.com/CaoMeiYouRen/rss-impact-server/commit/a892999))
* 增加 demo 地址；增加 启用注册 选项 ([b48b335](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b48b335))
* 增加 download 静态资源的挂载 ([0a373f0](https://github.com/CaoMeiYouRen/rss-impact-server/commit/0a373f0))
* 增加 enclosure 上限 ([11097aa](https://github.com/CaoMeiYouRen/rss-impact-server/commit/11097aa))
* 增加 RSS 检测并发限制 ([452bd00](https://github.com/CaoMeiYouRen/rss-impact-server/commit/452bd00))
* 增加 rss 请求超时时间 ([6fad12d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6fad12d))
* 增加 相同用户名/邮箱校验 ([13fb707](https://github.com/CaoMeiYouRen/rss-impact-server/commit/13fb707))
* 增加 磁盘最小空间 设置 ([6e6c17d](https://github.com/CaoMeiYouRen/rss-impact-server/commit/6e6c17d))
* 增加 进程运行时间 ([5a20a18](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5a20a18))
* 增加更多数据库信息输出 ([c8113f6](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c8113f6))
* 完成 Article 的 enclosure 字段的移除 ([fc8a14c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/fc8a14c))
* 新增 avue 相关类型声明 ([41c62fa](https://github.com/CaoMeiYouRen/rss-impact-server/commit/41c62fa))
* 新增 重置密码后 session 重置 ([bd28093](https://github.com/CaoMeiYouRen/rss-impact-server/commit/bd28093))
* 暂时修改 封面 URL 为 input ([607c4e5](https://github.com/CaoMeiYouRen/rss-impact-server/commit/607c4e5))
* 更改 JsonStringLengthRange 名称 ([5273a42](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5273a42))
* 更新 文件大小显示逻辑 ([e27133b](https://github.com/CaoMeiYouRen/rss-impact-server/commit/e27133b))
* 添加 filterArticles 测试用例 ([387ed17](https://github.com/CaoMeiYouRen/rss-impact-server/commit/387ed17))
* 添加 qbittorrent 支持 ([eadd480](https://github.com/CaoMeiYouRen/rss-impact-server/commit/eadd480))
* 移除 getDateTransformer 相关逻辑 ([c8b431e](https://github.com/CaoMeiYouRen/rss-impact-server/commit/c8b431e))
* 移除 publishDate 字段 ([5abbfd9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/5abbfd9))
* 迁移 发布日期 到 pubDate 字段 ([222bb7c](https://github.com/CaoMeiYouRen/rss-impact-server/commit/222bb7c))
* 隐藏 publishDate 字段 ([b0b69a9](https://github.com/CaoMeiYouRen/rss-impact-server/commit/b0b69a9))
