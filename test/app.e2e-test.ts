import path from 'path'
import fs from 'fs-extra'
import moduleAlias from 'module-alias'
moduleAlias.addAlias('@', path.join(__dirname, '../src'))
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { Express } from 'express'
import jestOpenAPI from 'jest-openapi'
import { AppModule } from '../src/app.module'
import { TasksService } from '../src/services/tasks/tasks.service'
import { sessionMiddleware } from '../src/middlewares/session.middleware'

const openApiSpecObject = fs.readJSONSync(path.join(__dirname, './openapi.json'))

jestOpenAPI(openApiSpecObject)

const apiPaths = Object.keys(openApiSpecObject?.paths)

describe('AppController (e2e)', () => {
    let app: INestApplication<Express>
    let cookie: string
    const tasksService = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onApplicationBootstrap: () => { },
    }
    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).overrideProvider(TasksService) // 覆盖掉 tasksService
            .useValue(tasksService)
            .compile()

        app = moduleFixture.createNestApplication()
        app.enableCors({})
        app.setGlobalPrefix('/api')
        app.use(sessionMiddleware)
        await app.init()
    })

    afterEach(async () => {
        // await app.close()
    })

    // it('GET /', (done) => {
    //     request(app.getHttpServer())
    //         .get('/')
    //         .expect(200, done)
    // })

    it('GET /api', (done) => {
        request(app.getHttpServer())
            .get('/api')
            .expect((res) => {
                expect(res).toSatisfyApiSpec()
            })
            .expect(200, done)

    })

    it('POST /api/auth/login', (done) => {
        const agent = request.agent(app.getHttpServer())
        agent
            .post('/api/auth/login')
            .send({ username: 'admin', password: '123456' })
            .set('Accept', 'application/json')
            .expect((res) => {
                // 获取 set-cookie 头
                const sessionCookie = res.headers['set-cookie'] as unknown as string[]
                cookie = sessionCookie.join('').split('; ')?.[0]
                // 检测 cookie 是否以 'connect.sid=' 开头
                expect(cookie).toMatch(/^connect\.sid=/)
                expect(res).toSatisfyApiSpec()
            })
            .expect(201, done)
    })

    it('GET /api/user/me', (done) => {
        request(app.getHttpServer())
            .get('/api/user/me')
            .set('Cookie', cookie) // 手动设置 cookie
            .expect((res) => {
                expect(res).toSatisfyApiSpec()
            })
            .expect(200, done)
    })
})
