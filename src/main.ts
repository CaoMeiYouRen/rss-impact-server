// eslint-disable-next-line import/order
import { CI, ENABLE_AUTH0, ENABLE_ORIGIN_LIST, PORT, RESOURCE_DOWNLOAD_PATH, SESSION_SECRET, SSRF_ALLOW_PRIVATE_NETWORK, SSRF_GUARD_ENABLED, __BENCHMARKS_TEST__, __DEV__ } from './app.config'
import path from 'path'
import moduleAlias = require('module-alias')
import './utils/sentry'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import fs from 'fs-extra'
import ms from 'ms'
import { NextFunction, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import { getGitInfo } from './utils/git-info'
import { setRequestId } from './middlewares/request.middleware'
import { sessionMiddleware } from './middlewares/session.middleware'
import { spaFallback } from './middlewares/history.middleware'
import { jsonLogger, logger } from './middlewares/logger.middleware'
import { TimeoutInterceptor } from './interceptors/timeout.interceptor'
import { limiter } from './middlewares/limit.middleware'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { AppModule } from './app.module'
import { DATABASE_DIR } from './db/database.module'
import { OIDCUserService } from './services/oidc/oidc-user.service'

moduleAlias.addAlias('@', path.join(__dirname, './'))

async function bootstrap() {
    if (!SSRF_GUARD_ENABLED) {
        logger.warn('SSRF 防护已关闭（SSRF_GUARD_ENABLED=false），所有出站 URL 将不再校验，请确认风险。')
    } else if (SSRF_ALLOW_PRIVATE_NETWORK) {
        logger.warn('SSRF 防护已放行私网地址（SSRF_ALLOW_PRIVATE_NETWORK=true），云元数据地址仍会被拒绝。')
    }
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
    if (SESSION_SECRET) {
        app.use(cookieParser(SESSION_SECRET))
    }
    app.use(sessionMiddleware)
    app.use(spaFallback) // 解决单页应用程序(SPA)重定向问题
    if (ENABLE_AUTH0) {
        // 使用动态 import，否则 auth.middleware 未初始化会导致 Nest 启动失败
        const { createAuthMiddleware } = await import('./middlewares/auth.middleware')

        try {
            const oidcUserService = app.get(OIDCUserService)
            const oidcMiddleware = await createAuthMiddleware(oidcUserService)
            app.use(oidcMiddleware)
            // express-openid-connect 在 Nest 之外，错误不会经过 Nest 的异常过滤器。
            // 这里统一把回调失败转成 4xx，避免默认 500 泄露堆栈。
            app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
                if (res.headersSent) {
                    next(err)
                    return
                }
                let status = 400
                if (typeof err?.status === 'number') {
                    status = err.status
                } else if (typeof err?.statusCode === 'number') {
                    status = err.statusCode
                }
                logger.warn(`OIDC 回调失败: ${err?.message || err}`)
                res.status(status).json({
                    statusCode: status,
                    message: status === 403 ? '无法完成 OIDC 登录' : '认证失败',
                })
            })
            logger.log('OIDC 中间件初始化成功')
        } catch (error) {
            // 失败时关闭 OIDC 而不是带着不完整的回调启动
            logger.error('无法初始化 OIDC 中间件，OIDC 登录已禁用:', error.message)
        }
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
