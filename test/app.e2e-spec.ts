import path from 'path'
import moduleAlias from 'module-alias'
moduleAlias.addAlias('@', path.join(__dirname, '../src'))

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'

describe('AppController (e2e)', () => {
    let app: INestApplication

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        await app.init()
    })

    it('/ (GET)', () => request(app.getHttpServer())
        .get('/')
        .expect(200))

    it('/error (GET)', () => request(app.getHttpServer())
        .get('/error')
        .expect(500))

    it('/async-error (GET)', () => request(app.getHttpServer())
        .get('/async-error')
        .expect(500))
})
