# 👨‍💻 使用

<!-- TODO 完善用户使用文档 -->

在开始使用前，请先阅读 [部署文档](./deploy.md)。

在浏览器中打开 `http://{Server IP}:3000` 访问 `RSS Impact Web` 页面。

如果部署存在困难，可以访问官方部署的 demo 站 `https://rss-demo.cmyr.dev` 进行试用。

用户名：`demo` 密码：`demodemo`

> Demo 站开放注册，可以随意体验。
>
> Demo 站不保证可用性，仅供演示使用。
>
> 注意：Demo 站每次部署都会重置数据，因此仅供体验，请勿存放重要数据！

如果你不希望数据被删除，可以访问内测体验站（需要注册账号）：https://rss-impact.cmyr.ltd

内测体验站目前也会和 Demo 站同步更新，所以不保证可用性（但在内测结束前，数据不会删除）。

## 注册

RSS Impact 是为多用户设计的，所以有账号系统。

在登录之前，您需要先注册一个账号。

> 如果不希望注册也想试用，请使用 demo 账号。 

### 通过表单注册

默认为表单注册。

通过这种方式注册，需要手动输入用户名、邮箱和密码。

![image-20241208171534816](https://oss.cmyr.dev/images/20241208171541919.png)

### 通过 Auth0 一键注册

如果您设置了 Auth0 登录，也可通过 Auth0 一键注册。

> 在设置了 Auth0 登录时，优先展示  Auth0 一键登录/注册

![image-20241208171735790](https://oss.cmyr.dev/images/20241208171735831.png)

点击一键注册按钮后，会跳转到 Auth0 统一登录页面，完成授权后即可完成注册。

> 目前支持使用 Google 和 GitHub 账号授权注册。

![image-20241208171935265](https://oss.cmyr.dev/images/20241208171935317.png)

草梅 Auth 会使用您授权的 Google 和 GitHub 账号信息在 RSS Impact 创建对应的账号。

具体而言，可能会使用的信息如下：

- 您的 Google 用户名和邮箱
- 您的 GitHub 用户名和邮箱
- 您的 Auth0 用户名和邮箱（如果不使用 Google 或 GitHub 授权）

## 登录

同注册一样，支持通过表单登录和通过 Auth0 一键登录

### 通过表单登录

您可以输入注册时留下的用户名和密码进行登录。

> 注意：如果您是通过 Auth0 一键注册的，默认会禁用密码登录功能，请使用 Auth0 一键注册时的账号授权登录。

![image-20241208172452731](https://oss.cmyr.dev/images/20241208172452779.png)

### 通过 Auth0 一键登录

![image-20241208171735790](https://oss.cmyr.dev/images/20241208171735831.png)

点击一键登录按钮后，会跳转到 Auth0 统一登录页面，完成授权后即可完成登录。

> 目前支持使用 Google 和 GitHub 账号授权登录。

![image-20241208172659481](https://oss.cmyr.dev/images/20241208172659530.png)

## 角色

### 普通用户

默认情况下，注册用户的角色均为 `user` ，即普通用户。

普通用户仅支持操作自己的数据。

### 管理员

管理员拥有 `admin` 、`user`角色权限。

管理员可以操作所有用户的权限，以及系统数据。

管理员的邮箱通过环境变量 `ADMIN_EMAIL` 设置，密码通过 `ADMIN_PASSWORD` 设置。

### 演示账号

演示账号拥有 `demo`、`user` 角色。

设置 `ENABLE_DEMO_ACCOUNT` 环境变量后，会在数据库中创建一个 demo 用户，用于演示功能。

demo 用户的个人信息数据无法修改。

demo 用户的用户名固定为 demo，密码固定为为 demodemo，邮箱固定为 demo@example.com

注意：**该账号拥有正常用户的权限，非演示站不要启用！**

## 订阅管理

切换到 `订阅管理` 页面，可以看到如下内容。

![image-20241208173414222](https://oss.cmyr.dev/images/20241208173414296.png)

目前，支持`快速添加订阅`、`从 OPML 文件导入` 或 `手动添加`

### 快速添加订阅

必填项仅 `URL`，其余可为空或有默认值。

您可以根据需要修改相关配置。

> 快速添加订阅时，会请求一次 URL 地址以获取最新数据。

![image-20241208173639253](https://oss.cmyr.dev/images/20241208173639300.png)

### 手动添加

您也可以点击 `新增` 按钮来手动填写订阅信息，该模式下可以更加精细的管理订阅。

![image-20241208174118588](https://oss.cmyr.dev/images/20241208174118644.png)

### 从 OPML 文件导入

如果您在其他 RSS 订阅软件中已有订阅列表，也可以 RSS 订阅列表导出为 OPML 文件，并在 RSS Impact 中导入。

支持 xml/opml 后缀名的文件。

![image-20241208173717042](https://oss.cmyr.dev/images/20241208173717086.png)

### 导出为 OPML 文件

当然如果您希望将 RSS Impact 的订阅列表进行导出，也可以点击 `导出` 按钮，将 RSS 订阅列表导出为 OPML 文件，以用于其他 RSS 订阅软件。

![image-20241208173935895](https://oss.cmyr.dev/images/20241208173935936.png)

## 分类管理

默认情况下，每个用户都会自动创建一个 `未分类` 分类，作为未选择分类时的默认值。

> 当使用 `从 OPML 文件导入` 功能时，会自动创建不存在的分类。

您可以在分类管理下查看每个分类下有哪些订阅。

## 文章管理

文章是从 RSS 订阅源获取的内容。

由系统自动获取，无法手动添加和修改文章。

对于属于自己的文章，可以进行查看和删除。

![image-20241208174816943](https://oss.cmyr.dev/images/20241208174817013.png)

## Hook 管理

Hook 是 RSS Impact 的核心功能，支持在文章新增的时候触发某些操作，也支持反转触发（即 RSS 源出错的时候触发）。

### 推送通知

基于 [push-all-in-one](https://github.com/CaoMeiYouRen/push-all-in-one) 开发，支持 Server 酱、自定义邮件、钉钉机器人、企业微信机器人 等多种推送方式。

支持 markdown 格式推送。

支持 [配置在线生成](https://push.cmyr.dev/)。

![image-20241208182545860](https://oss.cmyr.dev/images/20241208182545915.png)

### WebHook

支持 GET/POST/PUT/DELETE 等全部 HTTP 方法进行调用。

![image-20241208182710742](https://oss.cmyr.dev/images/20241208182710792.png)

### 下载

支持按 md5 过滤资源，支持按后缀名过滤资源。

![image-20241208183352601](https://oss.cmyr.dev/images/20241208183352648.png)

### BitTorrent

支持调用 qBitTorrent 接口来自动下载 BitTorrent ，也支持按体积过滤 BitTorrent ，解决部分 BitTorrent RSS 源没有提供 `enclosureLength` 的问题。

支持 `<mediaContent/>` tag。

![image-20241208183501673](https://oss.cmyr.dev/images/20241208183501724.png)

### AI 大模型

支持调用 OpenAI（或兼容 OpenAI 接口）的大模型，支持 AI 总结。

支持在 AI 总结后推送。

支持生成/翻译 RSS 分类 。

![image-20241208183632859](https://oss.cmyr.dev/images/20241208183632916.png)

### 正则替换

支持对正文内容进行替换，可用于替换链接为代理地址。

![image-20241208183729034](https://oss.cmyr.dev/images/20241208183729081.png)

### 过滤条件

保留想要的内容，必须符合全部条件才保留。支持通过正则表达式过滤。留空的规则不会过滤。

![image-20241208183808761](https://oss.cmyr.dev/images/20241208183808808.png)

### 排除条件

去掉不要的内容，有一个条件符合就排除。支持通过正则表达式排除。留空的规则不会排除。

![image-20241208183828730](https://oss.cmyr.dev/images/20241208183828775.png)

### 反转模式

如果启用，只会在 RSS 源出错的时候触发。

该模式仅支持 `推送通知` 和 `Webhook` 。

## 自定义查询

自定义查询可以聚合 RSS 订阅，并将查询结果转换为 RSS。

自定义查询支持将 AI 总结输出到正文中。

![image-20241208184537701](https://oss.cmyr.dev/images/20241208184537754.png)

可以通过输出路径直接访问对应的查询结果。

![image-20241208184728672](https://oss.cmyr.dev/images/20241208184728717.png)

## 代理配置

如果 RSS Impact 无法正常访问 RSS 订阅源，可以添加代理配置。

支持 http/socks5 代理。

例如：`http://127.0.0.1:8101`

## 资源管理

在 `下载` 和 `BitTorrent` 中下载的文件，会视为 `资源`，并统一在 `资源管理` 中查看。

> 如果文件是通过 `下载 Hook` 下载到服务器的，还会有文件路径，BitTorrent 则没有。

![image-20241208185118964](https://oss.cmyr.dev/images/20241208185119017.png)

## Webhook 和通知日志

`Webhook` 和 `推送通知` 的日志，可以查看推送渠道和 Webhook 请求是否成功

![image-20241208185248290](https://oss.cmyr.dev/images/20241208185248347.png)

## 个人中心

可以在 `个人中心` 页面查看个人信息，修改用户名、邮箱和密码。

![image-20241208185345182](https://oss.cmyr.dev/images/20241208185345240.png)

## 文档

可以在文档页面查看使用文档。

该页面是链接到 https://rss-docs.cmyr.dev/ 的

## 关于

可以在关于页面查看项目构建信息，用于问题反馈。

![image-20241208185550765](https://oss.cmyr.dev/images/20241208185550821.png)
