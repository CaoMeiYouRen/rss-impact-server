/* eslint-disable  @typescript-eslint/no-unused-vars */
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
        await app.close()
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

    it('POST /api/auth/login - should set session cookie', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ username: 'admin', password: '123456' })
            .set('Accept', 'application/json')
            .expect(201)

        const sessionCookie = response.headers['set-cookie']
        expect(sessionCookie).toBeDefined()
        expect(Array.isArray(sessionCookie)).toBe(true)
        cookie = sessionCookie[0].split(';')[0]
        expect(cookie).toMatch(/^connect\.sid=/)
    })

    it('GET /api/user/me - should maintain session', async () => {
        expect(cookie).toBeDefined()
        const response = await request(app.getHttpServer())
            .get('/api/user/me')
            .set('Cookie', cookie)
            .expect(200)

        expect(response.body).toHaveProperty('username', 'admin')
        expect(response.body).toHaveProperty('email', 'admin@example.com')
        expect(response.body).toHaveProperty('roles')
        expect(Array.isArray(response.body.roles)).toBe(true)
        expect(response.body.roles).toContain('admin')
    })

    it('GET /api/user/me - should reject without session', async () => {
        await request(app.getHttpServer())
            .get('/api/user/me')
            .expect(401)
    })
})
