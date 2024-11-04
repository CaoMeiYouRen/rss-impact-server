// eslint-disable-next-line import/order
import { CI, ENABLE_AUTH0, ENABLE_ORIGIN_LIST, PORT, RESOURCE_DOWNLOAD_PATH, __BENCHMARKS_TEST__, __DEV__ } from './app.config'
import path from 'path'
import moduleAlias from 'module-alias'
import './utils/sentry'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import history from 'connect-history-api-fallback'
import fs from 'fs-extra'
import artTemplate from 'art-template'
import ms from 'ms'
import { Request } from 'express'
import { DATABASE_DIR } from './db/database.module'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { limiter } from './middlewares/limit.middleware'
import { TimeoutInterceptor } from './interceptors/timeout.interceptor'
import { jsonLogger, logger } from './middlewares/logger.middleware'
import { sessionMiddleware } from './middlewares/session.middleware'
import { setRequestId } from './middlewares/request.middleware'
import { getGitInfo } from './utils/git-info'
import { timeFormat } from './utils/helper'

moduleAlias.addAlias('@', path.join(__dirname, './'))

artTemplate.defaults.onerror = (error) => logger.error(error)

async function bootstrap() {
    if (!await fs.pathExists(DATABASE_DIR)) {
        await fs.mkdir(DATABASE_DIR)
    }
    if (!await fs.pathExists(RESOURCE_DOWNLOAD_PATH)) {
        await fs.mkdir(RESOURCE_DOWNLOAD_PATH)
    }
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        // logger: __DEV__ ? ['error', 'warn', 'log', 'debug', 'verbose'] : ['error', 'warn', 'log'],
        logger: __BENCHMARKS_TEST__ ? false : logger, // 如果是基准测试，关闭日志
    })
    app.set('trust proxy', true)
    app.enableCors((req: Request, cb) => {
        if (!ENABLE_ORIGIN_LIST?.length) {
            cb(null, {})
            return
        }

        const origin = req.header('Origin') || `${req.protocol}://${req.hostname}`
        const enableOrigin = ENABLE_ORIGIN_LIST.some((url) => url.startsWith(origin))
        cb(null, {
            origin: enableOrigin && origin,
            methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie', 'Accept', 'Accept-Language', 'Content-Language', 'Sentry-Trace', 'Baggage'],
            credentials: enableOrigin, // 本项目中还需要启用 cookie
        })
    })
    app.setGlobalPrefix('/api')
    if (__DEV__) {
        const config = new DocumentBuilder()
            .setTitle('RSS Impact server docs')
            .setDescription('RSS Impact server docs')
            .setVersion('0.1.0')
            // .addBearerAuth()
            .addCookieAuth('connect.sid')
            // .setBasePath('/api')
            .build()
        const options: SwaggerDocumentOptions = {
            operationIdFactory: (
                controllerKey: string,
                methodKey: string,
            ) => `${controllerKey.replace(/Controller/i, '')}_${methodKey}`,
        }
        const document = SwaggerModule.createDocument(app, config, options)
        SwaggerModule.setup('docs', app, document)
        await fs.writeFile('test/openapi.json', JSON.stringify(document, null, 4))
    }

    if (!__BENCHMARKS_TEST__) { // 如果不是基准测试，则启用限流器/RequestId/日志
        app.use(limiter)
        app.use(setRequestId)
        app.use(jsonLogger)
    }
    // app.use(helmet({}))
    app.useGlobalFilters(new AllExceptionsFilter())
    app.useGlobalInterceptors(new TimeoutInterceptor())
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        skipUndefinedProperties: true, // 忽略 undefined。如果是 undefined ，表明该字段没有更新
        // skipMissingProperties: true,
        // forbidNonWhitelisted: true,
        enableDebugMessages: __DEV__,
    }))
    app.use(sessionMiddleware)
    app.use(history({
        rewrites: [
            // 匹配 /api 开头的路由,不进行回退
            {
                from: /^\/api\/.*$/,
                to(context) {
                    return context.parsedUrl.pathname
                },
            },
        ],
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
    })) // 解决单页应用程序(SPA)重定向问题
    if (ENABLE_AUTH0) {
        // 使用动态 import，否则 auth.middleware 未初始化会导致 Nest 启动失败
        const { authMiddleware } = await import('./middlewares/auth.middleware')
        app.use(authMiddleware)
    }

    await app.listen(PORT)
    logger.log(`应用访问地址为 http://127.0.0.1:${PORT}`)
    if (__DEV__) {
        logger.debug(`Docs http://127.0.0.1:${PORT}/docs`)
    }
    const { version } = await fs.readJson('package.json')
    const { gitHash, gitDate } = await getGitInfo()
    logger.log(`当前 RSS Impact server 版本为：${version}，构建哈希为：${gitHash}，构建时间为：${gitDate}`)

    if (CI && __BENCHMARKS_TEST__) {
        setTimeout(() => {
            logger.log('基准测试服务器已停止')
        }, ms('30 s'))
    }
}

bootstrap()
