import os from 'os'
import path from 'path'
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { Repository, In, LessThan, MoreThanOrEqual, Between, DataSource } from 'typeorm'
import { CronJob } from 'cron'
import { differenceWith, flattenDeep, pick, random, isEqual, pickBy, uniq } from 'lodash'
import XRegExp from 'xregexp'
import dayjs, { Dayjs } from 'dayjs'
import fs from 'fs-extra'
import md5 from 'md5'
import FileType from 'file-type'
import { QBittorrent } from '@cao-mei-you-ren/qbittorrent'
import { plainToInstance } from 'class-transformer'
import parseTorrent, { Instance, toMagnetURI } from 'parse-torrent'
import Parser from '@cao-mei-you-ren/rss-parser'
import OpenAI from 'openai'
import ms from 'ms'
import { isMagnetURI } from 'class-validator'
import rssParserUtils from '@cao-mei-you-ren/rss-parser/lib/utils'
import PQueue from 'p-queue'
import { ResourceService } from '@/services/resource/resource.service'
import { Feed } from '@/db/models/feed.entity'
import { RssCronList } from '@/constant/rss-cron'
import { __DEV__, AI_LIMIT_MAX, ARTICLE_LIMIT_MAX, ARTICLE_SAVE_DAYS, BIT_TORRENT_LIMIT_MAX, DATABASE_TYPE, DOWNLOAD_LIMIT_MAX, HOOK_LIMIT_MAX, LOG_SAVE_DAYS, NOTIFICATION_LIMIT_MAX, RESOURCE_DOWNLOAD_PATH, RESOURCE_SAVE_DAYS, REVERSE_TRIGGER_LIMIT, RSS_LIMIT_MAX, TZ } from '@/app.config'
import { getAllUrls, download, getMd5ByStream, timeFormat, splitString, isHttpURL, to, limitToken, getTokenLength, splitStringByToken, retryBackoff, parseDataSize, dataFormat, getFullText, getPriority } from '@/utils/helper'
import { ArticleFormatoption, articleItemFormat, articlesFormat, filterArticles, getArticleContent, rssItemToArticle, rssParserString } from '@/utils/rss-helper'
import { Article } from '@/db/models/article.entity'
import { Hook } from '@/db/models/hook.entity'
import { ajax, getHttpAgent } from '@/utils/ajax'
import { Resource } from '@/db/models/resource.entiy'
import { WebhookLog } from '@/db/models/webhook-log.entity'
import { runPushAllInOne } from '@/utils/notification'
import { isSafePositiveInteger } from '@/decorators/is-safe-integer.decorator'
import { User } from '@/db/models/user.entity'
import { Role } from '@/constant/role'
import { BitTorrentConfig } from '@/models/bit-torrent-config'
import { DownloadConfig } from '@/models/download-config'
import { WebhookConfig } from '@/models/webhook-config'
import { NotificationConfig } from '@/models/notification-config'
import { AIConfig } from '@/models/ai-config'
import { HttpError } from '@/models/http-error'
import { RegularConfig } from '@/models/regular-config'
import { DailyCount } from '@/db/models/daily-count.entity'

const removeQueue = new PQueue({ concurrency: Math.min(os.cpus().length, 8) }) // 删除文件并发数
const rssQueue = new PQueue({ concurrency: RSS_LIMIT_MAX }) // RSS 请求并发数
const hookQueue = new PQueue({ concurrency: HOOK_LIMIT_MAX }) // Hook 并发数
const downloadQueue = new PQueue({ concurrency: DOWNLOAD_LIMIT_MAX }) // 下载并发数限制
const aiQueue = new PQueue({ concurrency: AI_LIMIT_MAX }) // AI 总结并发数
const bitTorrentQueue = new PQueue({ concurrency: BIT_TORRENT_LIMIT_MAX }) // BitTorrent 并发数
const notificationQueue = new PQueue({ concurrency: NOTIFICATION_LIMIT_MAX }) // 推送 并发数

@Injectable()
export class TasksService implements OnApplicationBootstrap {

    private readonly logger = new Logger(TasksService.name)

    // eslint-disable-next-line max-params
    constructor(
        private readonly scheduler: SchedulerRegistry,
        private readonly resourceService: ResourceService,
        @InjectDataSource() private readonly dataSource: DataSource,
        @InjectRepository(Feed) private readonly feedRepository: Repository<Feed>,
        @InjectRepository(Article) private readonly articleRepository: Repository<Article>,
        @InjectRepository(Resource) private readonly resourceRepository: Repository<Resource>,
        @InjectRepository(WebhookLog) private readonly webhookLogRepository: Repository<WebhookLog>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(DailyCount) private readonly dailyCountRepository: Repository<DailyCount>,
    ) { }

    async onApplicationBootstrap() {
        await this.fixDatabase()
        await this.initFeedTasks()
    }

    private async fixDatabase() {
        try {
            //
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    private getAllFeeds() {
        return this.feedRepository.find({
            where: {
                isEnabled: true,
            },
            relations: ['proxyConfig'],
        })
    }

    private async initFeedTasks() {
        try {
            const feeds = await this.getAllFeeds()
            feeds.forEach(async (feed) => {
                this.enableFeedTask(feed)
                if (__DEV__) {
                    const priority = getPriority()
                    this.logger.log(`rss ${feed.url} 已进入订阅队列`)
                    await rssQueue.add(async () => {
                        this.logger.log(`rss ${feed.url} 正在检测更新中……`)
                        await this.getRssContent(feed)
                    }, { priority, timeout: ms('5 m') })
                }
            })
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    /**
     * 获取 RSS
     *
     * @author CaoMeiYouRen
     * @date 2024-03-21
     * @param feed
     * @param [rss]
     */
    async getRssContent(feed: Feed, rss?: Record<string, any> & Parser.Output<Record<string, any>>) {
        const { id: fid, url, userId: uid, isFullText = false } = feed
        let proxyUrl = feed.proxyConfig?.url
        try {
            if (!rss) {
                if (feed.proxyConfigId && !feed.proxyConfig) {
                    const newFeed = await this.feedRepository.findOne({ where: { id: fid }, relations: ['proxyConfig'] })
                    if (!newFeed.proxyConfig?.url) {
                        throw new Error(`订阅 id: ${feed.id} 的 proxyConfig 为空！`)
                    }
                    proxyUrl = newFeed.proxyConfig?.url
                }
                const maxRetries = feed.maxRetries || 0

                const response = await retryBackoff(
                    () => ajax({
                        url,
                        proxyUrl,
                        timeout: ms('60 s'),
                    }),
                    {
                        maxRetries,
                        initialInterval: ms('10 s'),
                        maxInterval: ms('5 m'), // 不超过最小轮询间隔
                    },
                )
                const resp = response.data
                if (resp) {
                    rss = await rssParserString(resp)
                }
            }
            if (!Array.isArray(rss?.items)) {
                return
            }
            if (!feed.description && rss.description) { // 解决部分情况下未设置 description 的问题
                feed.description = rss.description?.trim()
                await this.feedRepository.save(feed)
            }
            if (!feed.imageUrl && rss?.image?.url) { // 解决部分情况下未设置 imageUrl 的问题
                feed.imageUrl = rss.image.url
                await this.feedRepository.save(feed)
            }
            // 根据 guid 去重复 | 每个 user 的 不重复
            const guids = rss.items.map((e) => e.guid)
            const existingArticles = await this.articleRepository.find({
                where: {
                    guid: In(guids),
                    userId: uid,
                },
                select: ['guid'],
            })
            let diffArticles = differenceWith(rss.items, existingArticles, (a, b) => a.guid === b.guid)
                .map((item) => {
                    const article = rssItemToArticle(item)
                    article.feedId = fid
                    article.userId = uid
                    article.author = article.author || rss.author
                    return this.articleRepository.create(article)
                })
            if (!diffArticles?.length) {
                return
            }
            // 抓取网页全文
            if (isFullText) {
                diffArticles = await Promise.all(diffArticles.map(async (article) => {
                    const { link } = article
                    if (isHttpURL(link)) {
                        const [error, fullText] = await to(getFullText(link, proxyUrl))
                        if (error) {
                            this.logger.error(error?.message, error?.stack)
                            return article
                        }
                        // 如果抓取到的文本内容比原文还短，则认定为抓取失败
                        if (fullText.content?.length < article.content?.length) {
                            article.content = fullText.content || article.content // 仅正文优先使用抓取的内容
                            article.contentSnippet = rssParserUtils.getSnippet(article.content) || article.contentSnippet // 更新 纯文本格式
                            article.author = article.author || fullText.author
                            article.summary = article.summary || fullText.excerpt
                            // 如果 pubDate 不存在，且 date_published 是有效日期，则填补日期
                            article.pubDate = article.pubDate || (dayjs(fullText.date_published).isValid() ? dayjs(fullText.date_published).toDate() : undefined)
                        }
                    }
                    return article
                }))
            }
            const newArticles = await this.articleRepository.save(diffArticles)
            this.triggerHooks(feed, newArticles)
        } catch (error) {
            this.logger.error(`url: ${url}\nproxyUrl: ${proxyUrl}\nmessage: ${error?.message}`, error?.stack)
            this.reverseTriggerHooks(feed, error)
        }
    }

    /**
     * 处理反转触发的 Hook
     *
     * @author CaoMeiYouRen
     * @date 2024-04-04
     * @private
     * @param feed
     * @param error
     */
    private async reverseTriggerHooks(feed: Feed, error: Error) {
        const count = await this.webhookLogRepository.count({
            where: {
                feedId: feed.id,
                createdAt: MoreThanOrEqual(dayjs().add(-1, 'hour').toDate()), // 最近 1 小时
            },
        })
        if (count >= REVERSE_TRIGGER_LIMIT) {
            this.logger.warn(`订阅 id: ${feed.id} 在一小时内触发超过 ${REVERSE_TRIGGER_LIMIT} 次！跳过触发。`)
            return
        }
        // 拉取最新的 hook 配置
        // ；如果有 反转触发下限，则大于 反转触发下限 才触发 && (hook.reverseLimit ? hook.reverseLimit > count : true)
        const hooks = (await this.feedRepository.findOne({ where: { id: feed.id }, relations: ['proxyConfig', 'hooks', 'hooks.proxyConfig'], select: ['hooks'] }))
            ?.hooks   // 处理反转触发的 Hook；只触发 notification/webhook 类型的
            ?.filter((hook) => hook.isReversed && ['notification', 'webhook'].includes(hook.type))

        if (!hooks?.length) {
            return
        }
        const userId = feed.userId
        const user = await this.userRepository.findOne({ where: { id: userId } })
        const isAdmin = user?.roles?.includes(Role.admin) // 只有 admin 用户可以看到 堆栈
        hooks.forEach((hook) => hookQueue.add(async () => {
            try {
                switch (hook.type) {
                    case 'notification':
                        await this.reverseNotificationHook(hook, feed, error, isAdmin)
                        return
                    case 'webhook': {
                        const data = {
                            feed,
                            message: error?.message,
                            stack: __DEV__ || isAdmin ? error?.stack : undefined,
                            cause: __DEV__ || isAdmin ? error?.cause : undefined,
                            date: new Date(),
                        }
                        await this.webhook(hook, feed, data)
                        return
                    }
                    default:
                        this.logger.warn(`${hook.type} 类型的 Hook 无法反转触发！`)
                }
            } catch (error2) {
                this.logger.error(error2?.message, error2?.stack)
            }
        }, {
            timeout: ms('10 m'),
        }))

    }

    // 反转触发通知
    private async reverseNotificationHook(hook: Hook, feed: Feed, error: Error, isAdmin: boolean) {
        const config = hook.config as NotificationConfig
        const { isMarkdown = false } = config
        const title = `检测到【 ${feed.title} 】发生错误，请及时检查`
        let desp = `URL：${feed.url}
错误名称：${error?.name}
错误信息：${error?.message}
错误堆栈：${__DEV__ || isAdmin ? error?.stack : ''}
错误原因：${__DEV__ || isAdmin ? error?.cause : ''}
发生时间：${timeFormat()}`
        if (isMarkdown) {
            desp = desp.replace(/\n/g, '\n\n') // 替换为markdown下的换行
        }
        // 处理 URL 可能会被风控的问题
        const linkRegex = /https?:\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi
        const links = desp.match(linkRegex)
        if (links?.length) {
            links.forEach((link) => {
                desp = desp.replace(link, link.replaceAll('.', '\u200d.\u200d')) // 在点号上添加零宽字符
            })
        }
        await notificationQueue.add(() => this.notification(hook, feed, [], title, desp))
    }

    private async notification(hook: Hook, feed: Feed, articles: Article[], title: string, desp: string) {
        const userId = hook.userId
        const config = hook.config as NotificationConfig
        const proxyUrl = hook.proxyConfig?.url
        const { maxLength = 4096 } = config
        title = title.slice(0, 256)
        desp = desp.slice(0, maxLength || 4096)
        const webhookLog = this.webhookLogRepository.create({
            hookId: hook.id,
            userId,
            feedId: feed.id,
            status: 'unknown',
            type: 'notification',
            // title,
            // desp,
            articles,
        })
        try {
            this.logger.log(`正在执行推送渠道 ${config.type}`)
            const resp = await runPushAllInOne(title, desp, config, proxyUrl)
            await this.webhookLogRepository.save(this.webhookLogRepository.create({
                ...webhookLog,
                ...pick(resp, ['data', 'statusText', 'headers']),
                status: 'success',
                statusCode: resp.status,
            }))
            this.logger.log(`执行推送渠道 ${config.type} 成功`)
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            await this.webhookLogRepository.save(this.webhookLogRepository.create({
                ...webhookLog,
                data: error?.response?.data || error?.response || error,
                statusCode: 500,
                statusText: 'Internal Server Error',
                headers: error?.response?.headers || {},
                status: 'fail',
            }))
        }
    }

    /**
     * 触发 Hooks
     *
     * @author CaoMeiYouRen
     * @date 2024-03-25
     * @private
     * @param feed
     * @param articles
     */
    private async triggerHooks(feed: Feed, articles: Article[]) {
        const hooks = (await this.feedRepository.findOne({ where: { id: feed.id }, relations: ['proxyConfig', 'hooks', 'hooks.proxyConfig'], select: ['hooks'] }))// 拉取最新的 hook 配置
            ?.hooks
            ?.filter((hook) => !hook.isReversed) // 排除反转触发的
        if (!hooks?.length || !articles?.length) {
            return
        }
        hooks.forEach((hook) => {
            // 计算 Hook 优先级
            let priority = getPriority(1e4)
            switch (hook.type) {
                case 'regular': {
                    priority += 1e10
                    break
                }
                case 'notification': {
                    priority += 1e9
                    break
                }
                case 'webhook': {
                    priority += 1e8
                    break
                }
                case 'aiSummary': {
                    priority += 1e7
                    break
                }
                case 'download': {
                    priority += 1e6
                    break
                }
                case 'bitTorrent': {
                    priority += 1e5
                    break
                }
                default:
                    break
            }
            return hookQueue.add(async () => {
                try {
                    __DEV__ && this.logger.debug(`正在触发 Hook ${hook.name}`)
                    const filteredArticles = filterArticles(articles, hook)
                    if (!filteredArticles?.length) {
                        return
                    }
                    switch (hook.type) {
                        case 'notification': {
                            await this.notificationHook(hook, feed, filteredArticles)
                            return
                        }
                        case 'webhook': {
                            await this.webhook(hook, feed, filteredArticles)
                            return
                        }
                        case 'download': {
                            await this.downloadHook(hook, feed, filteredArticles)
                            return
                        }
                        case 'bitTorrent': {
                            await this.bitTorrentHook(hook, feed, filteredArticles)
                            return
                        }
                        case 'aiSummary': {
                            await this.aiHook(hook, feed, filteredArticles)
                            return
                        }
                        case 'regular': {
                            await this.regularHook(hook, feed, filteredArticles)
                            return
                        }
                        default:
                            this.logger.warn('未匹配到任何类型的Hook！')
                    }
                } catch (error) {
                    this.logger.error(error?.message, error?.stack)
                }
            }, {
                priority,
                timeout: ms('10 m'),
            })
        })
    }

    private async notificationHook(hook: Hook, feed: Feed, articles: Article[]) {
        const config = hook.config as NotificationConfig
        const { isMergePush = false, isMarkdown = false, isSnippet = false, onlySummary = false, maxLength = 4096, useAiSummary = false, appendAiSummary = false } = config
        const title = `检测到【 ${feed.title} 】有更新`
        const notifications: { title: string, desp: string, articles: Article[] }[] = []
        const articleFormatoption: ArticleFormatoption = { isMarkdown, isSnippet, onlySummary, useAiSummary, appendAiSummary }
        // 如果要使用 AI 总结，则延后
        if (appendAiSummary || useAiSummary) {
            const [error] = await to(retryBackoff(async () => {
                articles = await this.articleRepository.find({
                    where: {
                        id: In(articles.map((e) => e.id)),
                    },
                })
                if (articles.every((article) => article.aiSummary)) {
                    return
                }
                throw new Error('AI 总结未全部完成')
            }, {
                maxRetries: 10,
                initialInterval: ms('10 s'),
                maxInterval: ms('1 h'),
            }))
            if (error) {
                this.logger.error(error?.message, error?.stack)
            }
        }
        if (isMergePush) {
            // 合并推送
            const desp = articlesFormat(articles, articleFormatoption)
            // 如果过长，则考虑分割推送，但至多不超过 5 条
            const chunks = splitString(desp, maxLength).slice(0, 5) // 分割字符串
            chunks.forEach((chunk) => {
                notifications.push({
                    title,
                    desp: chunk,
                    articles,
                })
            })
        } else {
            // 逐条推送
            articles.forEach((article) => {
                const { text: desp, title: itemTitle } = articleItemFormat(article, articleFormatoption)
                // 如果过长，则考虑分割推送，但至多不超过 3 条
                const chunks = splitString(desp, maxLength).slice(0, 3) // 分割字符串
                chunks.forEach((chunk) => {
                    notifications.push({
                        title: itemTitle,
                        desp: chunk,
                        articles: [article],
                    })
                })
            })
        }

        notifications.forEach((notification) => notificationQueue.add(async () => this.notification(hook, feed, notification.articles, notification.title, notification.desp), {
            timeout: ms('10 m'),
        }))
    }

    private async webhook(hook: Hook, feed: Feed, data: Article[] | any) {
        const userId = hook.userId
        const proxyUrl = hook.proxyConfig?.url
        const webhookLog = this.webhookLogRepository.create({
            hookId: hook.id,
            userId,
            feedId: feed.id,
            status: 'unknown',
            type: 'webhook',
            articles: Array.isArray(data) ? data : null,
        })
        try {
            const config = hook.config as WebhookConfig
            this.logger.log(`正在触发 Webhook: ${config?.url}`)
            const resp = await ajax({
                ...config,
                proxyUrl,
                timeout: (config?.timeout || 60) * 1000,
                data: data as any,
            })
            await this.webhookLogRepository.save(this.webhookLogRepository.create({
                ...webhookLog,
                ...pick(resp, ['data', 'statusText', 'headers']),
                status: 'success',
                statusCode: resp.status,
            }))
            this.logger.log(`触发 Webhook: ${config?.url} 成功`)
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            await this.webhookLogRepository.save(this.webhookLogRepository.create({
                ...webhookLog,
                data: error?.response?.data || error?.response || error,
                statusCode: 500,
                statusText: 'Internal Server Error',
                headers: error?.response?.headers || {},
                status: 'fail',
            }))
        }
    }

    private async downloadHook(hook: Hook, feed: Feed, articles: Article[]) {
        const userId = hook.userId
        const config = hook.config as DownloadConfig
        const proxyUrl = hook.proxyConfig?.url
        const skipHashes = config.skipHashes.split(',').map((e) => e.trim())
        const { suffixes, timeout = 60 } = config
        const dirPath = path.resolve(RESOURCE_DOWNLOAD_PATH) // 解析为绝对路径
        const allUrls = flattenDeep(articles
            .map((article) => getAllUrls(article.content)))
            .filter((url) => XRegExp(suffixes, 'i').test(url)) // 匹配后缀名，不区分大小写
        if (!allUrls?.length) {
            return
        }
        if (!await fs.pathExists(dirPath)) {
            await fs.mkdir(dirPath)
        }
        allUrls.forEach((url) => downloadQueue.add(async () => {
            const ext = path.extname(url)
            const hashname = md5(url)
            const filename = hashname + ext
            const filepath = path.resolve(path.join(dirPath, filename))
            __DEV__ && this.logger.debug(`正在检测文件: ${filename}`)
            // 如果在数据库里
            let resource = await this.resourceRepository.findOne({
                where: { url, userId },
            })
            if (resource) {
                __DEV__ && this.logger.debug(`文件 ${filename} 已存在，跳过下载`)
                return
            }
            // 查找数据库内是否有其他用户存储了相同 URL 的文件
            resource = await this.resourceRepository.findOne({
                where: { url, status: 'success' },
            })
            // 如果有，则为该用户复制一份
            if (resource?.status === 'success') { // sikp/fail/unknown 的情况下重新下载
                delete resource.id
                delete resource.user
                delete resource.createdAt
                delete resource.updatedAt
                resource.userId = userId
                resource.status = skipHashes.includes(resource.hash) ? 'skip' : resource.status
                await this.resourceRepository.save(resource)
                __DEV__ && this.logger.debug(`文件 ${filename} 下载成功`)
                return
            }

            if (await fs.pathExists(filepath)) { // 如果已经下载了，则跳过
                __DEV__ && this.logger.debug(`文件 ${filename} 已存在，跳过下载`)
                // 同步到数据库
                const stat = await fs.stat(filepath)
                const { mime } = await FileType.fromFile(filepath)
                const hash = await getMd5ByStream(filepath)
                const newResource = this.resourceRepository.create({
                    url,
                    name: filename,
                    path: filepath,
                    status: 'success',
                    size: stat.size,
                    type: mime,
                    hash,
                    userId,
                })
                await this.resourceRepository.save(newResource)
                return
            }
            const newResource = this.resourceRepository.create({
                url,
                name: filename,
                path: filepath,
                status: 'unknown',
                userId,
            })

            try {
                // 由于 hash 只能在下载后计算得出，所以第一次下载依旧会下载整个文件
                __DEV__ && this.logger.debug(`正在下载文件: ${filename}`)
                const fileInfo = await download(url, filepath, (timeout || 60) * 1000, proxyUrl)
                newResource.type = fileInfo.type
                newResource.size = fileInfo.size
                newResource.hash = fileInfo.hash
                if (skipHashes.includes(fileInfo.hash)) {
                    newResource.status = 'skip'
                    newResource.path = ''
                    this.logger.log(`文件 ${filename} 在 skipHashes 内，已删除`)
                    // 尝试移除文件
                    await this.resourceService.removeFile(newResource)
                } else {
                    newResource.status = 'success'
                    this.logger.log(`文件 ${filename} 下载成功`)
                }
            } catch (error) {
                newResource.status = 'fail'
                this.logger.error(error?.message, error?.stack)
            } finally {
                await this.resourceRepository.save(newResource)
            }

        }, {
            timeout: ms('10 m'),
        }))
    }

    private async bitTorrentHook(hook: Hook, feed: Feed, articles: Article[]) {
        const userId = hook.userId
        const config = hook.config as BitTorrentConfig
        const proxyUrl = hook.proxyConfig?.url
        const { type } = config
        const btArticles = articles.filter((article) => article.enclosureType === 'application/x-bittorrent' && article.enclosureUrl) // 排除BT以外的
        if (!btArticles?.length) {
            return
        }
        switch (type) {
            case 'qBittorrent': {
                const { baseUrl, username, password, downloadPath, autoRemove = false } = config
                const maxSize = parseDataSize(config.maxSize || 0) // 附件的最大值
                const minDiskSize = parseDataSize(config.minDiskSize || 0) // 保留磁盘的最小值
                const qBittorrent = new QBittorrent({
                    baseUrl,
                    username,
                    password,
                    timeout: 60 * 1000,
                })
                btArticles.map((article) => {
                    const priority = 1e5 + getPriority(1e4)
                    return bitTorrentQueue.add(async () => {
                        try {
                            const url = article.enclosureUrl
                            const shoutUrl = url?.slice(0, 128)
                            let hash = ''
                            let magnetUri = ''
                            let name = ''
                            let size = 0
                            let magnet: Instance & { xl?: number }
                            // 判读磁盘空间不足时，是否自动删除
                            if (minDiskSize && autoRemove) {
                                // 判断 bt 服务器的磁盘空间 是否充足
                                await this.removeMaxSizeTorrent(qBittorrent, minDiskSize)
                                // return
                            }
                            if (article.enclosureLength === 1) { // 如果 length 为 1 ，则重新获取真实大小。例如：动漫花园 rss
                                article.enclosureLength = 0
                            }
                            // 如果是 magnet，则直接添加 磁力链接 /^magnet:/.test
                            if (isMagnetURI(url)) {
                                magnet = parseTorrent(url) as Instance
                                hash = magnet.infoHash?.toLowerCase()
                                const resource: Resource = await this.resourceRepository.findOne({ where: { hash, userId } })
                                if (resource) {
                                    __DEV__ && this.logger.debug(`资源 ${shoutUrl} 已存在，跳过该资源下载`)

                                    if (resource.url !== url && isHttpURL(resource.url) && !article.enclosureLength) { // 如果是不同的 url
                                        article.enclosureLength = resource.size // 更新附件大小
                                        await this.articleRepository.save(article)
                                    }
                                    return
                                }
                                this.logger.log(`正在下载资源：${shoutUrl}`)
                                await qBittorrent.addMagnet(url, { savepath: downloadPath })
                            } else if (isHttpURL(url)) {  // 如果是 http，则下载 bt 种子
                                if (await this.resourceRepository.findOne({ where: { url, userId } })) {
                                    __DEV__ && this.logger.debug(`资源 ${shoutUrl} 已存在，跳过该资源下载`)
                                    return
                                }
                                const resp = await ajax<ArrayBuffer>({
                                    url,
                                    proxyUrl,
                                    responseType: 'arraybuffer',
                                    timeout: 60 * 1000,
                                })
                                const torrent = Buffer.from(resp.data)
                                magnet = parseTorrent(torrent) as Instance
                                hash = magnet.infoHash?.toLowerCase() // hash
                                const resource: Resource = await this.resourceRepository.findOne({ where: { hash, userId } })
                                if (resource) {
                                    __DEV__ && this.logger.debug(`资源 ${shoutUrl} 已存在，跳过该资源下载`)
                                    // 解决存在不同源的相同资源缺少 size 的问题
                                    if (resource.url !== url && isMagnetURI(resource.url) && !article.enclosureLength) { // 如果是不同的 url
                                        article.enclosureLength = resource.size // 更新附件大小
                                        await this.articleRepository.save(article)
                                    }
                                    return
                                }
                                this.logger.log(`正在下载资源：${shoutUrl}`)
                                await qBittorrent.addTorrent(torrent, { savepath: downloadPath })
                            }

                            if (/^(https?:\/\/|magnet:)/.test(url)) {
                                name = magnet.name || magnet.dn as string

                                if (article.enclosureLength) {
                                    size = article.enclosureLength
                                } else if (magnet.length) {
                                    size = Number(magnet.length)
                                } else if (magnet.xl) {
                                    size = Number(magnet.xl)
                                }

                                const tracker = magnet.announce?.[0] // 仅保留第一个 tracker
                                magnetUri = toMagnetURI({
                                    infoHash: hash,
                                    dn: name || '',
                                    xl: size,
                                    tr: tracker,
                                } as Instance)
                                const resource = this.resourceRepository.create({
                                    url: isHttpURL(url) ? url : magnetUri,
                                    name, // 名称
                                    path: '', // 文件在服务器上的地址，没有必要，故统一留空
                                    status: size ? 'success' : 'unknown',
                                    size,  // 体积大小
                                    type: 'application/x-bittorrent',
                                    hash,
                                    userId,
                                })
                                const newResource = await this.resourceRepository.save(resource)
                                if (newResource.size > 0 && !article.enclosureLength) {
                                    article.enclosureLength = newResource.size // 更新附件大小
                                    await this.articleRepository.save(article)
                                }
                                // 判读磁盘空间
                                if (minDiskSize) {
                                    const mainData = await qBittorrent.getMainData(random(0, 1e8, false))
                                    // 如果 bt 服务器的磁盘空间不足，则停止下载
                                    if (mainData?.server_state?.free_space_on_disk && mainData.server_state.free_space_on_disk < minDiskSize) {
                                        this.logger.warn(`bt 服务器的磁盘空间小于 ${config.minDiskSize} ，停止下载`)
                                        newResource.status = 'skip'
                                        await this.resourceRepository.save(newResource)
                                        // 移除超过限制的资源
                                        // 校验是否真的删除了
                                        // 加到队列末尾
                                        bitTorrentQueue.add(async () => {
                                            await this.tryRemoveTorrent(qBittorrent, hash)
                                        }, { priority: -1, timeout: ms('10 m') })
                                        return
                                    }
                                }
                                // 判断附件大小
                                if (isSafePositiveInteger(maxSize) && maxSize > 0 && newResource.size > 0 && maxSize <= newResource.size) {
                                    this.logger.warn(`资源 ${shoutUrl} 的大小超过限制，跳过该资源下载`)
                                    newResource.status = 'skip'
                                    await this.resourceRepository.save(newResource)
                                    // 移除超过限制的资源
                                    // 校验是否真的删除了
                                    bitTorrentQueue.add(async () => {
                                        await this.tryRemoveTorrent(qBittorrent, hash)
                                    }, { priority: -1, timeout: ms('10 m') })
                                    return
                                }
                                // 由于 磁力链接没有元数据，因此在 qBittorrent 解析前不知道其大小
                                // 如果从种子解析出的 size 为空，则应该在 qBittorrent 解析后再次校验大小
                                if (!newResource.size || newResource.size <= 0) {
                                    // 加到队列末尾
                                    bitTorrentQueue.add(async () => {
                                        await retryBackoff(async () => {
                                            size = await this.updateTorrentInfo(qBittorrent, config, newResource, article)
                                            if (size > 0 || size === -1) {
                                                return
                                            }
                                            __DEV__ && this.logger.debug(`未解析出资源 ${shoutUrl} 的大小！即将重试。`)
                                            throw new Error(`未解析出资源 ${shoutUrl} 的大小！`)
                                        }, {
                                            maxRetries: 10,
                                            initialInterval: ms('10 s'),
                                            maxInterval: ms('10 m'),
                                        })
                                    }, { priority: priority - 1e5, timeout: ms('10 m') })
                                }
                                return
                            }
                            this.logger.error(`不支持的 资源类型：${shoutUrl}`)
                        } catch (error) {
                            this.logger.error(error?.message, error?.stack)
                        }
                    }, {
                        priority,
                        timeout: ms('1 h'),
                    },
                    )
                })
                return
            }
            default:
                throw new Error(`不支持的BT下载器类型: ${type}`)
        }
    }

    /**
     * 移除体积最大的 Torrent
     *
     * @author CaoMeiYouRen
     * @date 2024-07-07
     * @private
     */
    private async removeMaxSizeTorrent(qBittorrent: QBittorrent, minDiskSize: number) {
        try {
            await retryBackoff(async () => {
                // 判断 bt 服务器的磁盘空间是否不足，如果是，则删除
                // 为了防止并发造成的问题，每次删除前都需要再查询一次
                const mainData = await qBittorrent.getMainData(random(0, 1e8, false))
                const freeSpaceOnDisk = mainData?.server_state?.free_space_on_disk
                // 如果服务器磁盘空间足够，则跳过本次删除
                if (freeSpaceOnDisk && freeSpaceOnDisk >= minDiskSize) {
                    return
                }
                // 如果 bt 服务器的磁盘空间不足，则自动删除
                this.logger.warn(`bt 服务器当前的磁盘空间 ${dataFormat(freeSpaceOnDisk)} 小于 保留磁盘的最小值 ${dataFormat(minDiskSize)} ，正在自动删除中`)
                // 按 下载体积降序
                const torrents = await qBittorrent.listTorrents({ sort: 'downloaded', reverse: true })
                // torrents.sort((a, b) => b?.downloaded - a?.downloaded)
                const torrent = torrents.at(0)
                if (torrent?.downloaded) { // 如果 torrent 存在且下载的体积大于 0，则删除
                    await this.tryRemoveTorrent(qBittorrent, torrent.hash)
                    if (freeSpaceOnDisk + torrent.downloaded < minDiskSize) { // 如果删除了这个文件还不够，则继续删除
                        throw new Error('bt 服务器当前的磁盘空间不足，继续删除文件！')
                    }
                }
            }, {
                maxRetries: 3,
                initialInterval: ms('30 s'),
                maxInterval: ms('30 m'),
            })
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    private async tryRemoveTorrent(qBittorrent: QBittorrent, hash: string) {
        try {
            await retryBackoff(async () => {
                const [error, flag] = await to(qBittorrent.removeTorrent(hash, true))
                if (error || !flag) { // 删除失败
                    this.logger.error(error?.message, error?.stack)
                }
                const [error2, torrentInfo] = await to(qBittorrent.getTorrent(hash))
                if (error2) { // 如果报错，则说明删了
                    __DEV__ && this.logger.debug(error?.stack)
                    return
                }
                if (!torrentInfo) { // 如果没有数据，说明删了
                    return
                }
                throw new Error(`删除资源 ${hash} 失败`, { cause: error })
            }, {
                maxRetries: 10,
                initialInterval: ms('10 s'),
                maxInterval: ms('10 m'),
            })
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    /**
     * 更新 BT 资源信息
     *
     * @author CaoMeiYouRen
     * @date 2024-04-14
     */
    private async updateTorrentInfo(qBittorrent: QBittorrent, config: BitTorrentConfig, resource: Resource, article: Article) {
        const url = article.enclosureUrl
        const { hash } = resource
        const maxSize = parseDataSize(config.maxSize)
        const shoutUrl = url?.slice(0, 128)
        const [error, torrentInfo] = await to(qBittorrent.getTorrent(hash))
        if (error) {
            this.logger.error(`hash: ${hash}, url: ${shoutUrl}`)
            this.logger.error(error?.message, error?.stack)
            return 0
        }
        if (torrentInfo.totalSize <= 0) { // 还没解析出来
            return 0
        }
        const magnetUri = toMagnetURI({
            infoHash: hash,
            dn: torrentInfo.name || '',
            xl: torrentInfo.totalSize,
            tr: torrentInfo.raw?.tracker,
        } as Instance)
        resource.url = isHttpURL(url) ? url : magnetUri // 保存 http url，避免每次都下载
        resource.name = torrentInfo.name
        resource.size = torrentInfo.totalSize // 总大小
        if (resource.size > 0 && !article.enclosureLength) {
            article.enclosureLength = resource.size // 更新附件大小
            await this.articleRepository.save(article)
        }
        if (isSafePositiveInteger(maxSize) && maxSize > 0 && resource.size > 0 && maxSize <= resource.size) {
            this.logger.warn(`资源 ${shoutUrl} 的大小超过限制，跳过该资源下载`)
            // await qBittorrent.removeTorrent(hash, true) // 移除超过限制的资源
            resource.status = 'skip'
            await this.resourceRepository.save(resource)
            // 移除超过限制的资源
            // 校验是否真的删除了
            bitTorrentQueue.add(async () => {
                await this.tryRemoveTorrent(qBittorrent, hash)
            }, { priority: -1, timeout: ms('10 m') })
            return -1
        }
        switch (torrentInfo.state) {
            case 'error':
                resource.status = 'fail'
                break
            case 'warning':
                // resource.status = 'fail'
                resource.status = 'success'
                break
            case 'downloading':
                resource.status = 'success'
                break
            case 'seeding': // 如果是做种后完成的话，也是 seeding 状态
                resource.status = 'success'
                break
            case 'paused':
                resource.status = 'success'
                break
            case 'queued':
                resource.status = 'success'
                break
            // case 'checking':
            //     resource.status = 'success'
            //     break
            default: // checking/unknown
                resource.status = 'unknown'
                break
        }
        await this.resourceRepository.save(resource) // 更新状态
        return resource.size
    }

    private async aiHook(hook: Hook, feed: Feed, articles: Article[]) {
        const config = hook.config as AIConfig
        const proxyUrl = hook.proxyConfig?.url
        const { type, isOnlySummaryEmpty, contentType, isIncludeTitle, apiKey, prompt, timeout, isSplit } = config
        const isSnippet = contentType === 'text'
        let { minContentLength, maxTokens, temperature, maxContextLength, action, endpoint, model } = config
        endpoint = endpoint || 'https://api.openai.com/v1'
        model = model || 'gpt-3.5-turbo'
        action = action || 'summary'
        maxTokens = maxTokens || 2048
        maxContextLength = maxContextLength || 4096
        minContentLength = minContentLength ?? 1024
        temperature = temperature ?? 0
        const aiArticles = articles.filter((article) => {
            if (action === 'summary' && isOnlySummaryEmpty && article.summary) { // 如果已经有 summary 了，则不再生成 AI summary
                return false
            }
            if (minContentLength === 0) { // 如果设置为 0 ，则不限制最小正文长度
                return true
            }
            // 计算正文长度
            let content = getArticleContent(article, isSnippet, isIncludeTitle)
            // 如果为生成分类，则添加原有的分类到 content 中
            if (action === 'generateCategory' && article.categories?.length) {
                content += `\ncategories: ${article.categories.join(', ')}`
            }
            const contentLength = content.length
            return contentLength >= minContentLength
        })
        if (!aiArticles.length) {
            return
        }

        switch (type) {
            case 'openAI': {
                const openai = new OpenAI({
                    apiKey,
                    timeout: (timeout || 2 * 60) * 1000,
                    baseURL: endpoint,
                    httpAgent: getHttpAgent(proxyUrl),
                })

                let systemPrompt = ''
                if (action === 'summary') { // 总结
                    /**
                     你是一名文本摘要助理。您的任务是为给定的内容提供不超过1024个单词或汉字的简明摘要。摘要应：
                    1.涵盖原文的核心内容和要点，同时保持客观中立的语气。
                    2.不包含任何原始文本中没有的新内容或个人意见。
                    3.优先使用和原文相同的语言进行总结。
                    需要总结的内容是：
                    */
                    systemPrompt = `You are a text summarization assistant.
Your task is to provide a concise summary of no more than 1024 words or Chinese characters for the given content.
The summary should:
1.Cover the core content and main points of the original text, while maintaining an objective and neutral tone.
2.Not contain any new content or personal opinions that are not present in the original text.
3.Prioritize summarizing in the same language as the original text.
The content to be summarized is:`
                } else if (action === 'generateCategory') { // 生成分类
                    /** 你是一名 RSS 内容打标签助理。你的任务是为给定的内容生成若干个标签。生成的标签应符合如下要求：
                    1.标签应覆盖原文的核心内容和要点，同时保持客观中立的语气。
                    2.标签应该与原文高度相关，不包含原文不存在的内容
                    3.标签应当精确，而不是宽泛的
                    4.标签之间应当尽可能少的重合，避免同一个内容的多次提到
                    5.优先使用和原文相同的语言生成标签
                    6.生成标签时应当参考原本的分类列表、标题和正文
                    7.请参考 EXAMPLE JSON OUTPUT ，并以 JSON 格式返回结果。
                    8.如果你无法打标签，请参考 EXAMPLE JSON ERROR OUTPUT 给出错误信息。"reason" 替换为具体的错误原因，需要简短、明确。

                    EXAMPLE INPUT:
                    标题：[喵萌奶茶屋&amp;LoliHouse] 物语系列 / Monogatari Series: Off &amp; Monster Season - 08 业物语 [WebRip 1080p HEVC-10bit AAC ASSx2][简繁日内封字幕]
                    分类列表：动画

                    EXAMPLE JSON OUTPUT:
                    {
                        "tags":["动画","物语系列","Monogatari Series: Off & Monster Season","喵萌奶茶屋","LoliHouse"]
                    }

                    EXAMPLE JSON ERROR OUTPUT:
                    {
                        "error": "无法生成标签。Error: {reason}"
                    } */
                    systemPrompt = `You are an RSS content tagging assistant. Your task is to generate several tags for the given content. The generated tags should meet the following requirements:
1. Tags should cover the core content and key points of the original text, while maintaining an objective and neutral tone.
2. The tag should be highly relevant to the original text and not contain any content that does not exist in the original text
3. Tags should be precise, not broad
4. Tags should have as little overlap as possible to avoid multiple mentions of the same content
5. Prioritize using the same language as the original text to generate tags
6. When generating tags, reference should be made to the original classification list, title, and main text
7. Please refer to EXAMPLE JSON OUTPUT and return the result in JSON format.
8.If you are unable to tag, please refer to EXAMPLE JSON ERROR OUTPUT for error information. Replace 'reason' with a specific reason for the error, which needs to be brief and clear.

EXAMPLE INPUT:
[喵萌奶茶屋&amp;LoliHouse] 物语系列 / Monogatari Series: Off &amp; Monster Season - 08 业物语 [WebRip 1080p HEVC-10bit AAC ASSx2][简繁日内封字幕]
categories: 动画

EXAMPLE JSON OUTPUT:
{
    "tags":["动画","物语系列","Monogatari Series: Off & Monster Season","喵萌奶茶屋","LoliHouse"]
}

EXAMPLE JSON ERROR OUTPUT:
{
    "error": "生成标签失败。Error: {reason}"
}
`
                }
                const system = {
                    role: 'system',
                    content: prompt || systemPrompt,
                } as const
                const systemPromptLength = getTokenLength(system.content)
                // 保留给回复的 token
                const reservedTokens = maxContextLength - systemPromptLength // 最大上下文长度 减去 提示语的长度 为保留给回复的 token 长度
                if (reservedTokens <= 0) {
                    throw new HttpError(400, '最大 token 数过小！请修改配置！')
                }
                aiArticles.forEach((article) => aiQueue.add(async () => {
                    const articleContent = getArticleContent(article, isSnippet, isIncludeTitle)
                    const articleContentList = isSplit ? splitStringByToken(articleContent, reservedTokens) : [limitToken(articleContent, reservedTokens)]
                    if (action === 'summary') {
                        if (__DEV__) {
                            this.logger.debug(`正在总结文章(id: ${article.id})：${article.title}`)
                        } else {
                            this.logger.log(`正在总结文章 id: ${article.id}`)
                        }
                        const aiSummaries: string[] = []
                        for await (const content of articleContentList) { // 串行请求
                            const [error, chatCompletion] = await to(openai.chat.completions.create({
                                messages: [system, { role: 'user', content }],
                                model,
                                n: 1,
                                temperature,
                                max_tokens: maxTokens,
                            }))
                            if (error) {
                                this.logger.error(error?.message, error?.stack)
                            } else {
                                aiSummaries.push(chatCompletion?.choices?.[0]?.message?.content?.trim())
                            }
                        }
                        const aiSummary = aiSummaries.join('')
                        this.logger.log(`文章 ${article.title}(id: ${article.id}) 总结完成`)
                        article.aiSummary = aiSummary
                        await this.articleRepository.save(article)
                        return
                    }
                    if (action === 'generateCategory') { // 生成分类
                        this.logger.log(`正在分类文章 ${article.title}(id: ${article.id})`)
                        const aiCategories: string[] = []
                        for await (const content of articleContentList) { // 串行请求
                            const [error, chatCompletion] = await to(openai.chat.completions.create({
                                messages: [system, { role: 'user', content }],
                                model: model || 'gpt-3.5-turbo',
                                n: 1,
                                temperature,
                                max_tokens: maxTokens,
                                response_format: {
                                    type: 'json_object',
                                },
                            }))
                            if (error) {
                                this.logger.error(error?.message, error?.stack)
                            } else {
                                const respContent = chatCompletion?.choices?.[0]?.message?.content?.trim()
                                try {
                                    const respJson = JSON.parse(respContent)
                                    if (respJson?.error) {
                                        this.logger.error(respJson?.error)
                                    } else if (Array.isArray(respJson?.tags)) {
                                        aiCategories.push(...respJson.tags)
                                    }
                                } catch (error2) {
                                    this.logger.error(error2?.message, error2?.stack)
                                }
                            }
                        }
                        this.logger.log(`文章(id: ${article.id}) ${article.title} 分类完成`)
                        article.categories = uniq([...article.categories || [], ...aiCategories])
                        await this.articleRepository.save(article)
                    }
                }, {
                    timeout: ms('1 h'),
                }))
                return
            }
            default:
                throw new Error(`不支持的 AI 大模型: ${type}`)
        }
    }

    private async regularHook(hook: Hook, feed: Feed, articles: Article[]) {
        const config = hook.config as RegularConfig
        const { contentRegular, contentReplace } = config
        const reg = XRegExp(contentRegular, 'ig')
        const newArticles = articles.map((article) => {
            try {
                article.content = article.content.replace(reg, contentReplace)
                article.contentSnippet = article.contentSnippet.replace(reg, contentReplace)
                return article
            } catch (error) {
                this.logger.error(error?.message, error?.stack)
                return article
            }
        }).map((article) => plainToInstance(Article, article))
        await this.articleRepository.save(newArticles)
    }

    async enableFeedTask(feed: Feed, throwError = false) {
        const name = `feed_${feed.id}`
        try {
            if (!feed.isEnabled) {
                this.logger.warn(`定时任务 ${name} 已关闭，请启用后重试`)
                return
            }
            if (this.getCronJob(name)) {
                this.logger.warn(`定时任务 ${name} 已存在，无法重复启动！`)
                return
            }
            const cronTime = RssCronList.find((e) => e.value === feed.cron)?.label
            if (!cronTime) {
                this.logger.warn(`定时任务 ${name} 配置的 cronTime 有误！`)
                return
            }
            const job = CronJob.from({
                timeZone: TZ,
                cronTime,
                start: true,
                onTick: async () => {
                    try {
                        const priority = getPriority()
                        this.logger.log(`rss ${feed.url} 已进入订阅队列`)
                        await rssQueue.add(async () => {
                            this.logger.log(`rss ${feed.url} 正在检测更新中……`)
                            await this.getRssContent(feed)
                        }, { priority, timeout: ms('5 m') })
                    } catch (error) {
                        this.logger.error(error?.message, error?.stack)
                        // 如果出现异常就停止 该 rss
                        // await this.disableFeedTask(feed)
                    }
                },
            })
            this.addCronJob(name, job)
            this.logger.log(`定时任务 ${name}(${cronTime}) 已启动`)
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            if (throwError) {
                throw new Error('定时任务启用失败', { cause: error })
            }
        }
    }

    async disableFeedTask(feed: Feed, throwError = false) {
        const name = `feed_${feed.id}`
        try {
            // await this.feedRepository.update({ id: feed.id }, { isEnabled: false })
            this.deleteCronJob(name)
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            if (throwError) {
                throw new Error('定时任务禁用失败', { cause: error })
            }
        }
    }

    private getCronJob(name: string) {
        try {
            return this.scheduler.getCronJob(name)
        } catch (error) {
            this.logger.error(error?.message)
            return null
        }
    }

    private deleteCronJob(name: string) {
        try {
            this.scheduler.deleteCronJob(name)
            __DEV__ && this.logger.debug(`定时任务 ${name} 已删除`)
            return true
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            return false
        }
    }

    private addCronJob(name: string, job: CronJob) {
        try {
            this.scheduler.addCronJob(name, job)
            __DEV__ && this.logger.debug(`定时任务 ${name} 已新增`)
            return true
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            return false
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'removeArticles' }) // 每天删除一次
    private async removeArticles() {
        try {
            this.logger.log('开始移除过时的文章')
            const date = dayjs().hour(0).minute(0).second(0).millisecond(0).add(-ARTICLE_SAVE_DAYS, 'day').toDate()
            const removes = await this.articleRepository.delete({
                // pubDate: LessThan(date),
                createdAt: LessThan(date),
            })
            this.logger.log('成功移除过时的文章')
            this.logger.log(removes)
            const feeds = await this.feedRepository.find({
                where: {
                },
            })
            for await (const feed of feeds) {
                // 1. 查询记录总数
                const totalCount = await this.articleRepository.count({ where: { feedId: feed.id } })
                // 如果超过 单个订阅文章最大保存数量
                if (totalCount > ARTICLE_LIMIT_MAX) {
                    // 2. 查询最早的几条记录
                    this.logger.log(`正在删除订阅: ${feed.title}(id: ${feed.id}) 超过限制的文章`)
                    const recordsToDelete = await this.articleRepository.find({
                        where: { feedId: feed.id },
                        order: {
                            createdAt: 'DESC',
                        },
                        skip: ARTICLE_LIMIT_MAX, // 跳过前 ARTICLE_LIMIT_MAX 个
                        take: totalCount - ARTICLE_LIMIT_MAX, // 分页大小
                    })
                    // console.log('recordsToDelete', recordsToDelete.length)
                    // 3. 删除最早的几条记录
                    await Promise.allSettled(recordsToDelete.map((e) => removeQueue.add(async () => {
                        // remove 方法有数量限制，故采用队列
                        this.articleRepository.remove(e)
                    })))
                    // console.log(removes)
                    this.logger.log(`订阅: ${feed.title}(id: ${feed.id}), 成功移除超过数量的文章 ${recordsToDelete.length} 篇`)
                }
            }
            if (DATABASE_TYPE === 'sqlite') {
                removeQueue.add(async () => {
                    await this.sqliteAutoVacuum()
                }, { priority: -1 }) // 优先级设置为负数，排到队尾
            }
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'removeResources' }) // 每天删除一次
    private async removeResources() {
        try {
            this.logger.log('开始移除过时的资源')
            const date = dayjs().hour(0).minute(0).second(0).millisecond(0).add(-RESOURCE_SAVE_DAYS, 'day').toDate()
            const removes = await this.resourceRepository.delete({
                createdAt: LessThan(date),
            })
            this.logger.log('成功移除过时的资源')
            this.logger.log(removes)
            // 清理真实的文件
            const dirPath = path.resolve(RESOURCE_DOWNLOAD_PATH) // 解析为绝对路径
            const files = await fs.readdir(dirPath)

            files.forEach((file) => {
                if (/\.(sqlite|db)$/.test(file)) { // 防止把 download 的 path 设置成跟 data 一样，把数据库删了
                    return null
                }
                return removeQueue.add(async () => {
                    const obj = await this.resourceRepository.findOne({
                        where: {
                            name: file,
                            status: 'success',
                        },
                    })
                    if (!obj) { // 如果数据库中不存在该文件的记录，则删除
                        await fs.remove(path.join(dirPath, file))
                    }
                })
            })
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'removeLogs' }) // 每天删除一次
    private async removeLogs() {
        try {
            this.logger.log('开始移除过时的日志')
            const date = dayjs().hour(0).minute(0).second(0).millisecond(0).add(-LOG_SAVE_DAYS, 'day').toDate()
            const removes = await this.webhookLogRepository.delete({
                // pubDate: LessThan(date),
                createdAt: LessThan(date),
            })
            this.logger.log('成功移除过时的日志')
            this.logger.log(removes)
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    private async dailyCountByDate(dateInput: string | Date | Dayjs) { // 'YYYY-MM-DD'
        const defaultDate = dayjs(dateInput).tz().hour(0).minute(0).second(0).millisecond(0)
        const start = defaultDate.toDate() // 从0点开始算
        const end = defaultDate.add(1, 'day').add(-1, 'millisecond').toDate() // 到 23点59分59秒999毫秒
        const date = defaultDate.format('YYYY-MM-DD')
        const articleCount = await this.articleRepository.count({
            where: {
                createdAt: Between(start, end),
            },
        })
        const resourceCount = await this.resourceRepository.count({
            where: {
                createdAt: Between(start, end),
            },
        })
        const webhookLogCount = await this.webhookLogRepository.count({
            where: {
                createdAt: Between(start, end),
            },
        })
        const newDailyCount: Partial<DailyCount> = {
            date,
            articleCount,
            resourceCount,
            webhookLogCount,
        }
        const dailyCount = await this.dailyCountRepository.findOne({ where: { date } })
        const fields = ['articleCount', 'resourceCount', 'webhookLogCount']
        if (dailyCount) { // 如果存在且值不相等，则更新
            if (!isEqual(pickBy(newDailyCount, fields), pickBy(dailyCount, fields))) {
                await this.dailyCountRepository.save(this.dailyCountRepository.create({
                    ...dailyCount,
                    ...newDailyCount,
                }))
            }
            return null
        }
        return this.dailyCountRepository.save(this.dailyCountRepository.create(newDailyCount))
    }

    @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'dailyCountTimer' }) // 每天统计一次
    private async dailyCountTimer() {
        try {
            this.logger.log('开始统计 文章数、资源数、推送 webhook 数')
            const defaultDate = dayjs().hour(0).minute(0).second(0).millisecond(0)
            const start = defaultDate.add(-1, 'day').toDate() // 从前一天0点开始算
            await this.dailyCountByDate(start)
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    private async sqliteAutoVacuum() {
        // 触发 VACUUM，以自动回收未使用的空间
        try {
            this.logger.log('正在触发 VACUUM')
            await this.dataSource.query('VACUUM;')
            this.logger.log('VACUUM 执行成功')
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }
}
