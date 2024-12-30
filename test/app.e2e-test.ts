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
import { TypeOrmModule } from '@nestjs/typeorm'
import { } from 'typeorm'
import { AppModule } from '../src/app.module'
import { TasksService } from '../src/services/tasks/tasks.service'
import { sessionMiddleware } from '../src/middlewares/session.middleware'
import { entities } from '../src/db/database.module'

const openApiSpecObject = fs.readJSONSync(path.join(__dirname, './openapi.json'))

jestOpenAPI(openApiSpecObject)

describe('AppController (e2e)', () => {
    let app: INestApplication<Express>
    let cookie: string
    const tasksService = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onApplicationBootstrap: () => { },
    }

    beforeAll(async () => {

        // 确保测试数据库文件存在
        const testDbPath = path.join(__dirname, '../data/database.test.sqlite')
        try {
            if (!await fs.pathExists(path.dirname(testDbPath))) {
                await fs.mkdir(path.dirname(testDbPath), { recursive: true })
            }
        } catch (error) {
            console.error(error)
        }

        // 如果数据库文件不存在，我们需要初始化它
        if (!await fs.pathExists(testDbPath)) {
            // 创建一个临时的 TypeORM 连接来初始化数据库
            const tempModule = await Test.createTestingModule({
                imports: [
                    TypeOrmModule.forRoot({
                        type: 'sqlite',
                        database: testDbPath,
                        entities,
                        synchronize: true,
                        autoLoadEntities: true,
                    }),
                ],
            }).compile()

            const tempApp = tempModule.createNestApplication()
            await tempApp.init()

            // 确保完全关闭所有连接
            await tempApp.close()
        }

        // 检查数据库文件是否存在
        if (await fs.pathExists(testDbPath)) {
            console.log('数据库文件已存在，路径为：', testDbPath)
        } else {
            console.error('数据库文件不存在！')
            process.exit(1)
        }

        // 现在创建实际的测试应用
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).overrideProvider(TasksService)
            .useValue(tasksService)
            .compile()

        app = moduleFixture.createNestApplication()
        app.enableCors({})
        app.setGlobalPrefix('/api')
        app.use(sessionMiddleware)
        await app.init()
    }, 60000)

    afterAll(async () => {
        if (app) {
            await app.close()
        }
    }, 30000)

    it('GET /api', async () => {
        const response = await request(app.getHttpServer())
            .get('/api')
        expect(response).toSatisfyApiSpec()
        expect(response.status).toBe(200)
    }, 10000)

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
        expect(response).toSatisfyApiSpec()
    }, 30000)

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
    }, 10000)

    it('GET /api/user/me - should reject without session', async () => {
        await request(app.getHttpServer())
            .get('/api/user/me')
            .expect(401)
    }, 10000)
})
