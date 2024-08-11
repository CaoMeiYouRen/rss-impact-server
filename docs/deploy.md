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

# ⚙配置

更多参数请参考 `.env` 文件中的说明

```ini
PORT=3000
BASE_URL='http://localhost:3000'
# 启用跨域。如果前端和后端部署在不同域名下，需要跨域时，配置该项。
# ENABLE_ORIGIN_LIST=https://example1.com,https://example2.com
ENABLE_ORIGIN_LIST=''
# 超时时间(ms)
TIMEOUT=30000
# 数据库类型。参考 typeorm 支持的数据库类型
DATABASE_TYPE='sqlite'
# 如果是 sqlite，则无需其他数据库相关配置
# 如果是 mysql/postgres，则需要配置 MySQL/Postgres 相关配置
# MySQL/Postgres 相关配置如下
# 数据库 host
DATABASE_HOST='localhost'
# 数据库端口。mysql 默认的端口是3306，postgres 默认端口是 5432。
DATABASE_PORT=3306
# 数据库用户名
DATABASE_USERNAME='root'
# 数据库密码
DATABASE_PASSWORD=''
# 数据库名
DATABASE_DATABASE='rss-impact'
# 连接的字符集 utf8_unicode_ci/utf8_general_ci
DATABASE_CHARSET='utf8_general_ci'
# MySQL 服务器上配置的时区 （默认：local）
DATABASE_TIMEZONE='local'
# Postgre Schema 名称，默认是 "public".
DATABASE_SCHEMA='public'

# 每页最大查询条数
PAGE_LIMIT_MAX=1000

# session 超时时间
SESSION_MAX_AGE='30d'

# 时区，默认东八区
TZ='Asia/Shanghai'

# Session Secret，自行部署时必须修改
SESSION_SECRET='RSS_IMPACT'

# admin 用户密码，自行部署时必须修改
ADMIN_PASSWORD='123456'
ADMIN_EMAIL='admin@example.com'

# 数据的保存路径
DATA_PATH='./data'
# 图片等资源的保存路径
RESOURCE_DOWNLOAD_PATH='./data/download'
# 对 download 路径启用 http 静态代理，download 文件夹下的资源也可以通过 http 协议访问
ENABLE_DOWNLOAD_HTTP=true

# 最大全局 Hook 并发数
HOOK_LIMIT_MAX=10

# 同时进行检测更新的最大 RSS 数量
RSS_LIMIT_MAX=5

# 最大下载并发数
DOWNLOAD_LIMIT_MAX=5

# 最大 AI 请求并发数
AI_LIMIT_MAX=3

# 最大 BitTorrent 并发数
BIT_TORRENT_LIMIT_MAX=5

# 最大 推送 并发数
NOTIFICATION_LIMIT_MAX=5

# 启用注册
ENABLE_REGISTER=false

# Redis 连接地址
# 如果设置了 该项，则 limiter 和 session 都会用 redis
# REDIS_URL=redis://localhost:6379/

# 文章 最大保存天数
ARTICLE_SAVE_DAYS=90
# 资源 最大保存天数
RESOURCE_SAVE_DAYS=30
# Webhook和通知日志 最大保存天数
LOG_SAVE_DAYS=30

# 反转触发频率限制。单个 feed 每小时最多可反转触发的次数
REVERSE_TRIGGER_LIMIT=4

# RSS 路由缓存时间，单位：秒
CACHE_EXPIRE=300
# RSS 内存缓存时间，单位：秒
CACHE_CONTENT_EXPIRE=3600
```
