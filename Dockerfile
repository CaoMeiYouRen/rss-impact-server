# 安全基线：Node.js 26.13.1 修复了 2026-11-11 公布的安全问题（16 个 CVE，7 个 HIGH），
# 其中包括 CVE-2026-123863（HTTP/2 会话拆除断言，未认证客户端可远程 abort）、
# CVE-2026-123864（HTTPS 零长 TLS 写导致服务端堆内存被拷入请求体），
# 以及 llhttp / undici / sqlite 等依赖修复。
#
# 基础镜像使用自建镜像的精确版本 tag：内置官方 Node.js 26.13.1 的 musl 构建、
# Alpine 3.23.8（musl 1.2.5）、git 与 pnpm 11，并自带 musl pwrite 门禁与 Node 版本门禁；
# 本轮安全基线由下面的构建期校验兜底。该 tag 同时固定 Alpine 补丁版本与 Node 版本，便于审计。
#
# 固定 Alpine 3.23（musl 1.2.5）而不是 3.24：Alpine 3.24 的 musl 1.2.6 将 pwrite()
# 改为先调用 pwritev2(RWF_NOAPPEND)，且只在 EOPNOTSUPP / ENOSYS 时回退到 pwrite。
# 旧版 Docker/containerd 的 seccomp 策略会以 EPERM 拦截 pwritev2，导致镜像内
# SQLite（better-sqlite3）所有写入都报 disk I/O error，而读取正常。
# 确认宿主运行时允许 pwritev2 后可改用官方镜像：
# --build-arg NODE_IMAGE=node:26.13.1-alpine3.23
ARG NODE_IMAGE=caomeiyouren/alpine-nodejs:alpine3.23.8-node26.13.1

FROM ${NODE_IMAGE} AS nodejs

# 构建期兜底：即使通过 build-arg 替换了基础镜像，也拒绝使用未修复的 Node.js
RUN node -e "const [M,m,p]=process.versions.node.split('.').map(Number);const fixed=(M===22&&(m>23||(m===23&&p>=5)))||(M===24&&(m>22||(m===22&&p>=3)))||(M===26&&(m>13||(m===13&&p>=1)))||M>26;if(!fixed){console.error('Node.js '+process.versions.node+' 未包含 2026-11-11 安全修复，拒绝构建；请升级到 22.23.5 / 24.22.3 / 26.13.1 或更高版本');process.exit(1)}console.log('Node.js '+process.versions.node+' 已包含 2026-11-11 安全修复')"

# 自建镜像已预装 git/pnpm；这里兜底补装，兼容通过 --build-arg 换成官方 node 镜像的场景
RUN apk add --no-cache git && npm i -g pnpm

FROM ${NODE_IMAGE} AS runtime

# 前端构建阶段
FROM nodejs AS frontend-builder
# 如果前端更新了，但后端没有更新，需要发版时，修改该变量
ENV FRONTEND_VERSION='0.0.10'

WORKDIR /frontend

RUN git clone https://github.com/CaoMeiYouRen/rss-impact-web.git /frontend --depth=1 --branch=gh-pages

# 构建阶段
FROM nodejs AS builder

WORKDIR /app

COPY package.json .npmrc pnpm-lock.yaml pnpm-workspace.yaml /app/

RUN npm config set registry https://registry.npmjs.org/ && \
    pnpm config set registry https://registry.npmjs.org/ && \
    apk add --no-cache python3 make g++ git && \
    node -v && npm -v && pnpm -v && \
    npm i -g pnpm && pnpm i --frozen-lockfile

COPY . /app

RUN pnpm run build

# 缩小阶段
FROM nodejs AS docker-minifier

# @vercel/nft 与 fs-extra 单独安装在 /opt/minifier，避免被下面 COPY 的 node_modules 覆盖
WORKDIR /opt/minifier

RUN pnpm config set registry https://registry.npmjs.org/ && \
    pnpm add @vercel/nft@1.10.2 fs-extra@11.2.0 --save-prod

COPY --from=builder /app /app

RUN export PROJECT_ROOT=/app/ && \
    export NODE_PATH=/opt/minifier/node_modules && \
    node /app/scripts/minify-docker.js && \
    rm -rf /app/node_modules /app/scripts && \
    mv /app/app-minimal/node_modules /app/ && \
    rm -rf /app/app-minimal

# 生产阶段
FROM runtime

ENV NODE_ENV production
ENV GIT_HASH ${GIT_HASH}
ENV GIT_DATE ${GIT_DATE}

WORKDIR /app
# 后端部分
COPY --from=docker-minifier /app /app
# 前端部分
COPY --from=frontend-builder /frontend /app/public

EXPOSE 3000

CMD ["node", "dist/main.js"]
