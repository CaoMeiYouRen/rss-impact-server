import { Response } from 'express'
import { CustomQueryController } from './custom-query.controller'
import { CustomQuery } from '@/db/models/custom-query.entity'

const customQueryKey = 'custom-query-key:8f197580-be7f-464f-9701-7975c6cfe1db'

function createResponse() {
    const res = {
        headersSent: false,
        header: jest.fn(),
        status: jest.fn(),
        send: jest.fn(),
    }
    res.header.mockReturnValue(res)
    res.status.mockReturnValue(res)
    res.send.mockReturnValue(res)
    return res as unknown as Response & typeof res
}

function createCustomQuery(overrides: Partial<CustomQuery> = {}): CustomQuery {
    return {
        id: 13,
        userId: 1,
        name: '测试查询',
        format: 'rss2.0',
        filter: {},
        filterout: {},
        url: 'https://example.com/api/custom-query/rss/13',
        scope: 'all',
        categories: [],
        feeds: [],
        useAiSummary: false,
        appendAiSummary: false,
        key: customQueryKey,
        ...overrides,
    } as CustomQuery
}

function createController(options: { custom?: CustomQuery | null, articles?: unknown[] } = {}) {
    const { custom = createCustomQuery(), articles = [] } = options
    const repository = {
        findOne: jest.fn().mockResolvedValue(custom),
        save: jest.fn(),
        create: jest.fn(),
    }
    const articleRepository = {
        find: jest.fn().mockResolvedValue(articles),
    }
    const cacheService = {
        tryGet: jest.fn(async (_key: string, cb: () => unknown) => cb()),
        del: jest.fn(),
    }
    const controller = new CustomQueryController(
        repository as any,
        articleRepository as any,
        cacheService as any,
    )
    return { controller, repository, articleRepository, cacheService }
}

describe('CustomQueryController.customQuery', () => {
    it('缺少 key 时应返回 403，且不查询数据库', async () => {
        const { controller, repository, cacheService } = createController()
        const res = createResponse()

        await expect(controller.customQuery(13, undefined, res)).rejects.toMatchObject({
            status: 403,
        })

        expect(repository.findOne).not.toHaveBeenCalled()
        expect(cacheService.tryGet).not.toHaveBeenCalled()
        expect(res.send).not.toHaveBeenCalled()
    })

    it('key 错误时应返回 403', async () => {
        const { controller, repository } = createController()
        const res = createResponse()

        await expect(controller.customQuery(13, 'custom-query-key:wrong', res)).rejects.toMatchObject({
            status: 403,
        })

        // 按 id 查询，key 只用于校验，避免 undefined 让 where 条件被忽略
        expect(repository.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 13 },
        }))
    })

    it('id 不存在时应返回 404', async () => {
        const { controller } = createController({ custom: null })
        const res = createResponse()

        await expect(controller.customQuery(999, customQueryKey, res)).rejects.toMatchObject({
            status: 404,
        })
        expect(res.send).not.toHaveBeenCalled()
    })

    it('key 正确时应返回 200，缓存键需要包含 key', async () => {
        const { controller, repository, articleRepository, cacheService } = createController()
        const res = createResponse()

        await controller.customQuery(13, customQueryKey, res)

        expect(cacheService.tryGet).toHaveBeenCalledWith(
            `custom-query-rss:13:${customQueryKey}`,
            expect.any(Function),
        )
        expect(repository.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 13 },
        }))
        expect(articleRepository.find).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('<rss'))
    })
})
