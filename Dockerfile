# 阶段一：构建阶段
FROM caomeiyouren/alpine-nodejs:1.1.0 as builder

WORKDIR /app

COPY package.json .npmrc pnpm-lock.yaml /app/

RUN pnpm i --frozen-lockfile

COPY . /app

RUN pnpm run build

# 阶段二：缩小阶段
FROM caomeiyouren/alpine-nodejs:1.1.0 as docker-minifier

WORKDIR /app

RUN pnpm add @vercel/nft@0.24.4 fs-extra@11.2.0 --save-prod

COPY --from=builder /app /app

RUN export PROJECT_ROOT=/app/ && \
    node /app/scripts/minify-docker.js && \
    rm -rf /app/node_modules /app/scripts && \
    mv /app/app-minimal/node_modules /app/ && \
    rm -rf /app/app-minimal

# 阶段三：生产阶段
FROM caomeiyouren/alpine-nodejs-minimize:1.0.0

ENV NODE_ENV production

WORKDIR /app

COPY --from=docker-minifier /app /app

EXPOSE 3000

CMD ["node", "dist/main.js"]
