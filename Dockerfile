# 安全基线：Node.js 24.22.1 修复了 2026-10-21 公布的安全问题，其中包括
# CVE-2026-111497（Brotli 解码越界写入，可导致远程代码执行）。
# 原先钉死的自建镜像 alpine3.22-node24.16 不含该修复，且其 apk add nodejs
# 的构建方式依赖 Alpine 仓库更新，无法保证及时跟进。
#
# 基础镜像固定 Alpine 3.23（musl 1.2.5）而不是默认的 Alpine 3.24：
# Alpine 3.24 的 musl 1.2.6 将 pwrite() 改为先调用 pwritev2(RWF_NOAPPEND)，
# 且只在 EOPNOTSUPP / ENOSYS 时回退到 pwrite。旧版 Docker/containerd 的 seccomp
# 策略会以 EPERM 拦截 pwritev2，导致镜像内 SQLite（better-sqlite3）所有写入
# 都报 disk I/O error，而读取正常。确认宿主运行时允许 pwritev2 后可切回
# --build-arg NODE_IMAGE=node:24.22.1-alpine。
ARG NODE_IMAGE=node:24.22.1-alpine3.23

FROM ${NODE_IMAGE} AS nodejs

# 构建期兜底：即使通过 build-arg 替换了基础镜像，也拒绝使用未修复的 Node.js
RUN node -e "const [M,m,p]=process.versions.node.split('.').map(Number);const fixed=(M===22&&(m>23||(m===23&&p>=4)))||(M===24&&(m>22||(m===22&&p>=1)))||(M===26&&(m>12||(m===12&&p>=1)))||M>26;if(!fixed){console.error('Node.js '+process.versions.node+' 未包含 2026-10-21 安全修复，拒绝构建；请升级到 22.23.4 / 24.22.1 / 26.12.1 或更高版本');process.exit(1)}console.log('Node.js '+process.versions.node+' 已包含 2026-10-21 安全修复')"

# 官方 node:alpine 镜像不含 git/pnpm，补齐原自建镜像已预装的构建工具
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

WORKDIR /app

RUN pnpm config set registry https://registry.npmjs.org/ && \
    pnpm add @vercel/nft@1.10.2 fs-extra@11.2.0 --save-prod

COPY --from=builder /app /app

RUN export PROJECT_ROOT=/app/ && \
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
