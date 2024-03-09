import { PORT, __DEV__ } from './app.config'
import path from 'path'
import moduleAlias from 'module-alias'
moduleAlias.addAlias('@', path.join(__dirname, './'))
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { ValidationPipe } from '@nestjs/common'
import { consoleLogger, fileLogger } from './middlewares/logger.middleware'
import { TimeoutInterceptor } from './interceptors/timeout.interceptor'
import { limiter } from './middlewares/limit.middleware'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)
    if (__DEV__) {
        const options = new DocumentBuilder()
            .setTitle('nest template docs')
            .setDescription('nest template docs')
            .setVersion('0.1.0')
            // .addBearerAuth()
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
    app.useGlobalPipes(new ValidationPipe())
    app.set('trust proxy', true)

    await app.listen(PORT)
    console.log(`Docs http://127.0.0.1:${PORT}/docs`)
}

bootstrap()
