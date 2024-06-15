# 🚀 部署

部署 RSS Impact 需要基本的计算机编程常识，如果您在部署过程中遇到无法解决的问题请到 [issues](https://github.com/CaoMeiYouRen/rss-impact-server/issues) 寻找类似的问题或 [向我们提问](https://github.com/CaoMeiYouRen/rss-impact-server/issues/new/choose)，我们会尽快给您答复

部署涉及到以下基本编程常识：

1.  命令行操作
2.  [Git](https://git-scm.com/)
3.  [Node.js](https://nodejs.org/)
4.  [npm](https://www.npmjs.com/get-npm) 或 [yarn](https://yarnpkg.com/zh-Hans/docs/install) 或 [pnpm](https://www.pnpm.cn/)

部署到可外网访问则可能涉及到：

1.  [Nginx](https://www.nginx.com/resources/wiki/start/topics/tutorials/install/)
2.  [Docker](https://www.docker.com/get-started) 或 [docker-compose](https://docs.docker.com/compose/install/)
3.  [Redis](https://redis.io/download)

## Docker 镜像

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

## Docker Compose 部署（推荐）

下载 [docker-compose.yml](https://github.com/CaoMeiYouRen/rss-impact-server/blob/master/docker-compose.yml)

```sh
wget https://github.com/CaoMeiYouRen/rss-impact-server/blob/master/docker-compose.yml
```

检查有无需要修改的配置

```sh
vim docker-compose.yml  # 也可以是你喜欢的编辑器
```

> 在公网部署时请务必修改 ADMIN_PASSWORD、SESSION_SECRET 环境变量
>
> 如果要使用自定义查询功能，请修改 BASE_URL 环境变量

启动

```sh
docker-compose up -d
```

在浏览器中打开 `http://{Server IP}:3000` 即可查看结果

关闭

```sh
docker-compose down
```

## Docker 部署

运行下面的命令下载 RSS Impact 镜像

```sh
docker pull caomeiyouren/rss-impact-server
```

然后运行 RSS Impact 即可

```sh
docker run -d --name rss-impact-server -p 3000:3000 caomeiyouren/rss-impact-server
```

在浏览器中打开 `http://{Server IP}:3000` 即可查看结果

您可以使用下面的命令来关闭 RSS Impact 

```sh
docker stop rss-impact-server
```

## 手动部署

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