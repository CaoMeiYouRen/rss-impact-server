# rss-impact-server

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
