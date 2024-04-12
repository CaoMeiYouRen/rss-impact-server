import path from 'path'
import moduleAlias from 'module-alias'
moduleAlias.addAlias('@', path.join(__dirname, '../src'))

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { TasksService } from '../src/services/tasks/tasks.service'

describe('AppController (e2e)', () => {
    let app: INestApplication
    const tasksService = {
        onApplicationBootstrap: () => { },
    }
    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).overrideProvider(TasksService) // 覆盖掉 tasksService
            .useValue(tasksService)
            .compile()

        app = moduleFixture.createNestApplication()
        await app.init()
    })

    afterEach(async () => {
        await app.close()
    })

    it('/ (GET)', (done) => {
        request(app.getHttpServer())
            .get('/')
            .expect(200, done)
    })

    // it('/error (GET)', () => request(app.getHttpServer())
    //     .get('/error')
    //     .expect(500))

    // it('/async-error (GET)', () => request(app.getHttpServer())
    //     .get('/async-error')
    //     .expect(500))
})
