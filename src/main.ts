// eslint-disable-next-line import/order
import { PORT, __DEV__ } from './app.config'
import path from 'path'
import moduleAlias from 'module-alias'
moduleAlias.addAlias('@', path.join(__dirname, './'))
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { limiter } from './middlewares/limit.middleware'
import { TimeoutInterceptor } from './interceptors/timeout.interceptor'
import { consoleLogger, fileLogger } from './middlewares/logger.middleware'
import { sessionMiddleware } from './middlewares/session.middleware'

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)

    if (__DEV__) {
        const options = new DocumentBuilder()
            .setTitle('RSS Impact server docs')
            .setDescription('RSS Impact server docs')
            .setVersion('0.1.0')
            .addBearerAuth()
            .build()
        const document = SwaggerModule.createDocument(app, options)
        SwaggerModule.setup('docs', app, document)

    }
    app.enableCors({})
    app.use(limiter)
    app.use(helmet({}))
    app.use(fileLogger)
    app.use(consoleLogger)
    app.useGlobalFilters(new AllExceptionsFilter())
    app.useGlobalInterceptors(new TimeoutInterceptor())
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

    app.use(sessionMiddleware)

    app.set('trust proxy', true)

    await app.listen(PORT)
    console.log(`Docs http://127.0.0.1:${PORT}/docs`)
}

bootstrap()
