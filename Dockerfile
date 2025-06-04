FROM caomeiyouren/alpine-nodejs:latest AS nodejs

FROM caomeiyouren/alpine-nodejs-minimize:latest AS runtime

# 前端构建阶段
FROM nodejs AS frontend-builder
# 如果前端更新了，但后端没有更新，需要发版时，修改该变量
ENV FRONTEND_VERSION='0.0.10'

WORKDIR /frontend

RUN git clone https://github.com/CaoMeiYouRen/rss-impact-web.git /frontend --depth=1 --branch=gh-pages

# 构建阶段
FROM nodejs AS builder

WORKDIR /app

COPY package.json .npmrc pnpm-lock.yaml /app/

RUN npm config set registry https://registry.npmjs.org/ && \
    pnpm config set registry https://registry.npmjs.org/ && \
    apk add --no-cache python3 make g++ git && \
    # 解决 node-gyp 编译问题
    npm config set python /usr/bin/python3 && \
    npm i -g pnpm node-gyp@latest && pnpm i --frozen-lockfile && \
    node -v && npm -v && pnpm -v && node-gyp -v && python -V

COPY . /app

RUN pnpm run build

# 缩小阶段
FROM nodejs AS docker-minifier

WORKDIR /app

RUN pnpm config set registry https://registry.npmjs.org/ && \
    pnpm add @vercel/nft@0.24.4 fs-extra@11.2.0 --save-prod

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
