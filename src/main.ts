// eslint-disable-next-line import/order
import { PORT, __DEV__ } from './app.config'
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
import { DATABASE_DIR } from './db/database.module'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { limiter } from './middlewares/limit.middleware'
import { TimeoutInterceptor } from './interceptors/timeout.interceptor'
import { consoleLogger, fileLogger } from './middlewares/logger.middleware'
import { sessionMiddleware } from './middlewares/session.middleware'

async function bootstrap() {
    const dir = DATABASE_DIR
    if (!await fs.pathExists(dir)) {
        await fs.mkdir(dir)
    }
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: __DEV__ ? ['error', 'warn', 'log', 'debug', 'verbose'] : ['error', 'warn', 'log'],
    })

    app.set('trust proxy', true)

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
    }

    app.enableCors({})
    app.use(limiter)
    app.use(helmet({}))
    app.use(fileLogger)
    app.use(consoleLogger)
    app.useGlobalFilters(new AllExceptionsFilter())
    app.useGlobalInterceptors(new TimeoutInterceptor())
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        // forbidNonWhitelisted: true,
        enableDebugMessages: __DEV__,
    }))
    app.use(sessionMiddleware)

    app.use(history({})) // 解决单页应用程序(SPA)重定向问题

    await app.listen(PORT)
    console.log(`Docs http://127.0.0.1:${PORT}/docs`)
}

bootstrap()
