import { Entity } from 'typeorm'
import { IsNotEmpty } from 'class-validator'
import { Base } from './base.entity'
import { winstonLogger } from '@/middlewares/logger.middleware'
import { HttpError } from '@/models/http-error'

jest.mock('@/middlewares/logger.middleware', () => ({
    winstonLogger: {
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
    },
    logDir: '/tmp',
    logger: {
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        log: jest.fn(),
    },
}))

jest.mock('@/app.config', () => ({
    __DEV__: true,
    DATABASE_TYPE: 'sqlite',
}))

@Entity()
class TestEntity extends Base {

    @IsNotEmpty()
    name: string

}

describe('Base entity insertValidate / updateValidate 原型链损坏防护', () => {
    let entity: TestEntity

    beforeEach(() => {
        jest.clearAllMocks()
        entity = new TestEntity()
        entity.name = 'test-name'
    })

    describe('insertValidate', () => {
        it('原型链完整时应正常执行（不抛错）', async () => {
            await expect((entity as any).insertValidate()).resolves.toBeUndefined()
        })

        it('实体有验证错误时应抛出 HttpError', async () => {
            const badEntity = new TestEntity()
            badEntity.name = '' // @IsNotEmpty() 校验失败
            await expect((badEntity as any).insertValidate()).rejects.toThrow(HttpError)
        })

        it('原型链完全断裂 (constructor === undefined) 时应安全跳过', async () => {
            // 复现生产环境 Bug:
            // TypeORM 在错误场景下创建的 entity 对象可能丢失 prototype，
            // 导致 this.constructor === undefined，
            // 进而 class-transformer 对 undefined 调用 .toString() 引发 TypeError
            const broken = Object.create(null, {
                id: { value: undefined, enumerable: true },
                createdAt: { value: new Date(), enumerable: true },
                updatedAt: { value: new Date(), enumerable: true },
            })
            Object.setPrototypeOf(broken, null)

            const validateFn = (TestEntity.prototype as any).insertValidate.bind(broken)
            await expect(validateFn()).resolves.toBeUndefined()
            expect(winstonLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('原型链损坏'),
            )
        })

        it('spread 导致 constructor 变为 Object 时应安全降级', async () => {
            // tasks.service.ts 中 { ...webhookLog } 会将 constructor 变为 Object，
            // 导致 class-validator 拒绝该对象（无装饰器元数据）
            const spreadEntity = { ...entity }
            const validateFn = (TestEntity.prototype as any).insertValidate.bind(spreadEntity)
            const result = await validateFn().catch((e: Error) => e)
            // 不应是 TypeError: Cannot read properties of undefined (reading 'toString')
            expect(result).not.toBeInstanceOf(TypeError)
            if (result instanceof Error) {
                expect(result.message).not.toContain('reading \'toString\'')
            }
        })
    })

    describe('updateValidate', () => {
        it('原型链完整时应正常执行（不抛错）', async () => {
            await expect((entity as any).updateValidate()).resolves.toBeUndefined()
        })

        it('原型链完全断裂 (constructor === undefined) 时应安全跳过', async () => {
            const broken = Object.create(null, {
                id: { value: undefined, enumerable: true },
                createdAt: { value: new Date(), enumerable: true },
                updatedAt: { value: new Date(), enumerable: true },
            })
            Object.setPrototypeOf(broken, null)

            const validateFn = (TestEntity.prototype as any).updateValidate.bind(broken)
            await expect(validateFn()).resolves.toBeUndefined()
            expect(winstonLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('原型链损坏'),
            )
        })

        it('spread 导致 constructor 变为 Object 时应安全降级', async () => {
            const spreadEntity = { ...entity }
            const validateFn = (TestEntity.prototype as any).updateValidate.bind(spreadEntity)
            const result = await validateFn().catch((e: Error) => e)
            expect(result).not.toBeInstanceOf(TypeError)
            if (result instanceof Error) {
                expect(result.message).not.toContain('reading \'toString\'')
            }
        })
    })
})
