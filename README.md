<h1 align="center">rss-impact-server </h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://hub.docker.com/r/caomeiyouren/rss-impact-server" target="_blank">
  <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/caomeiyouren/rss-impact-server">
  </a>
    <a href="https://app.codecov.io/gh/CaoMeiYouRen/rss-impact-server" target="_blank">
     <img alt="Codecov" src="https://img.shields.io/codecov/c/github/CaoMeiYouRen/rss-impact-server">
  </a>
  <a href="https://github.com/CaoMeiYouRen/rss-impact-server/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/rss-impact-server/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D16-blue.svg" />
  <a href="https://github.com/CaoMeiYouRen/rss-impact-server#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/rss-impact-server/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/rss-impact-server/blob/master/LICENSE" target="_blank">
    <img alt="License: AGPL-3.0" src="https://img.shields.io/github/license/CaoMeiYouRen/rss-impact-server?color=yellow" />
  </a>
</p>


> RSS + Hook = RSS Impact
>
> 一个基于 RSS 的 Hook 系统。本项目为后端部分。

**温馨提示：本项目还在开发阶段，功能还不完善，暂时还不建议在生产环境使用。**

## 🏠 主页

[https://github.com/CaoMeiYouRen/rss-impact-server#readme](https://github.com/CaoMeiYouRen/rss-impact-server#readme)

## 🌰 Demo

https://rss-demo.cmyr.ltd/

> Demo 站开放注册，可以随意体验。
>
> Demo 站不保证可用性，仅供演示使用。
>
> 注意：Demo 站每次部署都会重置数据，因此仅供体验，请勿存放重要数据！

## ✨功能亮点

- 项目的核心在于 Hook ，本项目支持 推送通知、Webhook 、下载、BitTorrent、AI 大模型 等多种形式的 Hook ，还支持反转触发（即 RSS 源出错的时候触发）。
- 推送通知 Hook 基于 [push-all-in-one](https://github.com/CaoMeiYouRen/push-all-in-one) 开发，支持 Server 酱、自定义邮件、钉钉机器人、企业微信机器人 等多种推送方式。支持 markdown 格式推送。
- BitTorrent Hook 支持调用 qBitTorrent 接口来自动下载 BitTorrent ，也支持按体积过滤 BitTorrent ，解决部分 BitTorrent RSS 源没有提供 `enclosure.length` 的问题。支持 `<mediaContent/>` tag。
- Webhook 支持 GET/POST 等全部 HTTP 方法进行调用
- 下载 Hook 支持按 md5 过滤资源，支持按后缀名过滤资源。
- AI Hook 支持调用 OpenAI（或兼容 OpenAI 接口）的大模型，支持 AI 总结。支持在 AI 总结后推送。
- 支持正则替换 Hook，可对正文内容进行替换，可用于替换链接为代理地址。
- 支持自定义查询，并将查询结果转换为 RSS。自定义查询支持将 AI 总结输出到正文中。
- 支持从 OPML 文件导入订阅，也支持导出订阅为 OPML 文件。
- 支持 Docker 一键部署
- 支持 Redis 缓存
- 支持 SQLite 作为数据库
- 支持配置代理

## 📦 依赖要求


- node >=16

## 🚀 部署

### Docker 镜像

支持两种注册表：

- Docker Hub: [`caomeiyouren/rss-impact-server`](https://hub.docker.com/r/caomeiyouren/rss-impact-server)
- GitHub: [`ghcr.io/caomeiyouren/rss-impact-server`](https://github.com/CaoMeiYouRen/rss-impact-server/pkgs/container/rss-impact-server)

支持以下架构：

- `linux/amd64`
- ~~`linux/arm/v7`~~
- ~~`linux/arm64`~~

> linux/arm/v7 和 linux/arm64 尚未进行测试

有以下几种 tags：

| Tag            | 描述     | 举例          |
| :------------- | :------- | :------------ |
| `latest`       | 最新     | `latest`      |
| `{YYYY-MM-DD}` | 特定日期 | `2024-06-07`  |
| `{sha-hash}`   | 特定提交 | `sha-0891338` |
| `{version}`    | 特定版本 | `1.2.3`       |

### Docker Compose 部署（推荐）

下载 [docker-compose.yml](https://github.com/CaoMeiYouRen/rss-impact-server/blob/master/docker-compose.yml)

```sh
wget https://github.com/CaoMeiYouRen/rss-impact-server/blob/master/docker-compose.yml
```

检查有无需要修改的配置

```sh
vim docker-compose.yml  # 也可以是你喜欢的编辑器
```

> 在公网部署时请务必修改 ADMIN_PASSWORD、SESSION_SECRET 环境变量

启动

```sh
docker-compose up -d
```

在浏览器中打开 `http://{Server IP}:3000` 即可查看结果

### 手动部署

部署 `RSS Impact` 最直接的方式，您可以按照以下步骤将 `RSS Impact` 部署在您的电脑、服务器或者其他任何地方

```sh
# 构建后端部分
git clone https://github.com/CaoMeiYouRen/rss-impact-server.git  --depth=1
cd rss-impact-server
pnpm i --frozen-lockfile
pnpm build
# 构建前端部分
cd ../
git clone https://github.com/CaoMeiYouRen/rss-impact-web.git --depth=1
cd rss-impact-web
pnpm i --frozen-lockfile
pnpm build
# 复制前端部分到后端
cd ../
cp -rp "rss-impact-web/dist" "rss-impact-server/public"
# 启动项目
cd rss-impact-server
pnpm start
```

在浏览器中打开 `http://{Server IP}:3000` 即可查看结果

## 👨‍💻 使用

```sh
pnpm run start
```

## 🛠️ 开发

```sh
pnpm run dev
```

## 🔧 编译

```sh
pnpm run build
```

## 🧪 测试

```sh
pnpm run test
```

## 🔍 Lint

```sh
pnpm run lint
```

## 💾 Commit

```sh
pnpm run commit
```


## 👤 作者


**CaoMeiYouRen**

* Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)

* GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)


## 🤝 贡献

欢迎 贡献、提问或提出新功能！<br />如有问题请查看 [issues page](https://github.com/CaoMeiYouRen/rss-impact-server/issues). <br/>贡献或提出新功能可以查看[contributing guide](https://github.com/CaoMeiYouRen/rss-impact-server/blob/master/CONTRIBUTING.md).

## 💰 支持

如果觉得这个项目有用的话请给一颗⭐️，非常感谢

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/rss-impact-server&type=Date)](https://star-history.com/#CaoMeiYouRen/rss-impact-server&Date)

## 📝 License

1. 本项目采用 AGPLv3 授权，并附加以下额外条件。
2. 任何个人和商业实体可以基于本项目进行商业化使用，但必须遵守以下额外条件:
3. 商业化使用的产品或服务中，必须包含与原项目明显不同的功能或改进。这些不同之处需要在产品描述中向最终用户充分披露。
4. 个人可以基于本项目进行非商业化使用，无需遵守第 3 条的额外条件。 
5. 非商业化使用是指不以营利为目的的使用。
6. 如果您至少向本项目提交并被合并 1 个有效的功能改进或问题修复，可以免除第 3 条的条件。本条仅适用于个人。
7. 对于任何贡献到本项目的代码，贡献者同意：项目所有者可以在遵守项目协议的前提下，用于非商业化和商业化用途；项目所有者可以按照项目协议的条款对外分发该代码。
8. 项目所有者保留对违反以上授权说明的个人和商业实体追究的权利。
9. 本授权说明可能会进行修改或更新。修改后的授权说明从公布修改内容的次日 00:00(UTC+8) 时起开始生效,并适用于此后对本项目的使用。

Copyright © 2024 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).<br />
This project is [AGPL-3.0](https://github.com/CaoMeiYouRen/rss-impact-server/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
