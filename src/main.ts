// eslint-disable-next-line import/order
import { PORT, RESOURCE_DOWNLOAD_PATH, __DEV__ } from './app.config'
import path from 'path'
import moduleAlias from 'module-alias'
moduleAlias.addAlias('@', path.join(__dirname, './'))
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { ValidationPipe } from '@nestjs/common'
import history from 'connect-history-api-fallback'
import fs from 'fs-extra'
import artTemplate from 'art-template'
import { setRequestId } from './middlewares/request.middleware'
import { sessionMiddleware } from './middlewares/session.middleware'
import { fileLogger, logger } from './middlewares/logger.middleware'
import { TimeoutInterceptor } from './interceptors/timeout.interceptor'
import { limiter } from './middlewares/limit.middleware'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { AppModule } from './app.module'
import { DATABASE_DIR } from './db/database.module'

artTemplate.defaults.excape = true
artTemplate.defaults.minimize = true
artTemplate.defaults.htmlMinifierOptions.collapseWhitespace = true
artTemplate.defaults.onerror = (error) => logger.error(error)
artTemplate.defaults.debug = false

async function bootstrap() {
    if (!await fs.pathExists(DATABASE_DIR)) {
        await fs.mkdir(DATABASE_DIR)
    }
    if (!await fs.pathExists(RESOURCE_DOWNLOAD_PATH)) {
        await fs.mkdir(RESOURCE_DOWNLOAD_PATH)
    }
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        // logger: __DEV__ ? ['error', 'warn', 'log', 'debug', 'verbose'] : ['error', 'warn', 'log'],
        logger,
    })

    app.set('trust proxy', true)
    app.enableCors({})
    app.setGlobalPrefix('/api')
    if (__DEV__) {
        const config = new DocumentBuilder()
            .setTitle('RSS Impact server docs')
            .setDescription('RSS Impact server docs')
            .setVersion('0.1.0')
            // .addBearerAuth()
            // .addCookieAuth()
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

    app.use(limiter)
    app.use(helmet({}))
    app.use(setRequestId)
    app.use(fileLogger)
    // app.use(consoleLogger)
    app.useGlobalFilters(new AllExceptionsFilter())
    app.useGlobalInterceptors(new TimeoutInterceptor())
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
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

    await app.listen(PORT)

    logger.log(`应用访问地址为 http://127.0.0.1:${PORT}`)
    if (__DEV__) {
        logger.debug(`Docs http://127.0.0.1:${PORT}/docs`)
    }

}

bootstrap()
