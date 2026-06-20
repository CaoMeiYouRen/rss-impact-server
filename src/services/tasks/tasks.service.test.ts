import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { SchedulerRegistry } from '@nestjs/schedule'
import { DataSource } from 'typeorm'
import { CacheService } from '../cache/cache.service'
import { TasksService } from './tasks.service'
import { ResourceService } from '@/services/resource/resource.service'
import { Feed } from '@/db/models/feed.entity'
import { Article } from '@/db/models/article.entity'
import { Resource } from '@/db/models/resource.entiy'
import { WebhookLog } from '@/db/models/webhook-log.entity'
import { User } from '@/db/models/user.entity'
import { DailyCount } from '@/db/models/daily-count.entity'
import { CustomQuery } from '@/db/models/custom-query.entity'
import { Category } from '@/db/models/category.entity'
import { Hook } from '@/db/models/hook.entity'
import { ProxyConfig } from '@/db/models/proxy-config.entity'

// Mock modules that cause side effects
jest.mock('@/utils/queue', () => ({
    rssQueue: { add: jest.fn() },
    hookQueue: { add: jest.fn() },
    notificationQueue: { add: jest.fn() },
    downloadQueue: { add: jest.fn() },
    bitTorrentQueue: { add: jest.fn() },
    aiQueue: { add: jest.fn() },
    removeQueue: { add: jest.fn() },
}))

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
    CustomLogger: jest.fn(),
}))

jest.mock('@/app.config', () => ({
    __DEV__: true,
    __PROD__: false,
    __TEST__: true,
    DATABASE_TYPE: 'sqlite',
    ARTICLE_LIMIT_MAX: 1000,
    ARTICLE_SAVE_DAYS: 30,
    DISABLE_EMPTY_FEEDS: false,
    LOG_SAVE_DAYS: 30,
    MAX_ERROR_COUNT: 10,
    RESOURCE_DOWNLOAD_PATH: '/tmp/download',
    RESOURCE_SAVE_DAYS: 30,
    REVERSE_TRIGGER_LIMIT: 10,
    TZ: 'Asia/Shanghai',
}))

jest.mock('@/utils/rss-helper', () => ({
    ArticleFormatoption: {},
    articleItemFormat: jest.fn(),
    articlesFormat: jest.fn(),
    filterArticles: jest.fn((articles) => articles),
    getArticleContent: jest.fn(),
    rssItemToArticle: jest.fn(),
    rssParserString: jest.fn(),
}))

jest.mock('@/utils/ajax', () => ({
    ajax: jest.fn(),
    getHttpAgent: jest.fn(),
}))

jest.mock('@/utils/notification', () => ({
    runPushAllInOne: jest.fn(),
}))

describe('TasksService retryDbWrite', () => {
    let service: TasksService

    const mockRepo = () => ({
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn((dto: any) => dto as any),
        count: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
    })

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                SchedulerRegistry,
                { provide: ResourceService, useValue: { removeFile: jest.fn() } },
                { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
                { provide: DataSource, useValue: { query: jest.fn(), options: { type: 'better-sqlite3' } } },
                { provide: getRepositoryToken(Feed), useFactory: mockRepo },
                { provide: getRepositoryToken(Article), useFactory: mockRepo },
                { provide: getRepositoryToken(Resource), useFactory: mockRepo },
                { provide: getRepositoryToken(WebhookLog), useFactory: mockRepo },
                { provide: getRepositoryToken(User), useFactory: mockRepo },
                { provide: getRepositoryToken(DailyCount), useFactory: mockRepo },
                { provide: getRepositoryToken(CustomQuery), useFactory: mockRepo },
                { provide: getRepositoryToken(Category), useFactory: mockRepo },
                { provide: getRepositoryToken(Hook), useFactory: mockRepo },
                { provide: getRepositoryToken(ProxyConfig), useFactory: mockRepo },
            ],
        }).compile()

        service = module.get<TasksService>(TasksService)
    })

    it('操作成功时应直接返回结果', async () => {
        const operation = jest.fn().mockResolvedValue('success')
        const result = await (service as any).retryDbWrite(operation)
        expect(result).toBe('success')
        expect(operation).toHaveBeenCalledTimes(1)
    })

    it('遇到 disk I/O error 时应重试并最终成功', async () => {
        let callCount = 0
        const operation = jest.fn().mockImplementation(() => {
            callCount++
            if (callCount < 3) {
                throw new Error('SqliteError: disk I/O error')
            }
            return 'recovered'
        })
        const result = await (service as any).retryDbWrite(operation)
        expect(result).toBe('recovered')
        expect(operation).toHaveBeenCalledTimes(3)
    })

    it('遇到 SQLITE_BUSY 时应重试', async () => {
        let callCount = 0
        const operation = jest.fn().mockImplementation(() => {
            callCount++
            if (callCount < 2) {
                throw new Error('SQLITE_BUSY: database is locked')
            }
            return 'ok'
        })
        const result = await (service as any).retryDbWrite(operation)
        expect(result).toBe('ok')
        expect(operation).toHaveBeenCalledTimes(2)
    })

    it('遇到 SQLITE_IOERR 时应重试', async () => {
        let callCount = 0
        const operation = jest.fn().mockImplementation(() => {
            callCount++
            if (callCount < 2) {
                throw new Error('SQLITE_IOERR_WRITE')
            }
            return 'ok'
        })
        const result = await (service as any).retryDbWrite(operation)
        expect(result).toBe('ok')
        expect(operation).toHaveBeenCalledTimes(2)
    })

    it('非数据库 I/O 错误不应重试', async () => {
        const operation = jest.fn().mockRejectedValue(new Error('Some other error'))
        await expect((service as any).retryDbWrite(operation)).rejects.toThrow('Some other error')
        // shouldRetry 返回 false，因此只调用 1 次
        expect(operation).toHaveBeenCalledTimes(1)
    })

    it('超出最大重试次数后应抛出最终错误', async () => {
        const operation = jest.fn().mockRejectedValue(new Error('SqliteError: disk I/O error'))
        await expect((service as any).retryDbWrite(operation)).rejects.toThrow()
        // 默认 maxRetries=5，retryBackoff 在 retries>=maxRetries 时抛出
        expect(operation).toHaveBeenCalledTimes(5)
    })
})
