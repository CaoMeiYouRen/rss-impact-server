import os from 'os'
import path from 'path'
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, LessThan, MoreThanOrEqual } from 'typeorm'
import { CronJob } from 'cron'
import { differenceWith, flattenDeep, pick } from 'lodash'
import XRegExp from 'xregexp'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import pLimit from 'p-limit'
import md5 from 'md5'
import FileType from 'file-type'
import { QBittorrent } from '@cao-mei-you-ren/qbittorrent'
import { plainToInstance } from 'class-transformer'
import parseTorrent, { Instance, toMagnetURI } from 'parse-torrent'
import Parser from 'rss-parser'
import { ResourceService } from '@/services/resource/resource.service'
import { Feed } from '@/db/models/feed.entity'
import { RssCronList } from '@/constant/rss-cron'
import { __DEV__, ARTICLE_SAVE_DAYS, DOWNLOAD_LIMIT_MAX, LOG_SAVE_DAYS, RESOURCE_DOWNLOAD_PATH, RESOURCE_SAVE_DAYS, REVERSE_TRIGGER_LIMIT, TZ } from '@/app.config'
import { getAllUrls, randomSleep, download, getMd5ByStream, timeFormat, sleep, splitString, isHttpURL, to } from '@/utils/helper'
import { articleItemFormat, articlesFormat, filterArticles, rssItemToArticle, rssParserString } from '@/utils/rss-helper'
import { Article, EnclosureImpl } from '@/db/models/article.entity'
import { Hook } from '@/db/models/hook.entity'
import { ajax } from '@/utils/ajax'
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

const downloadLimit = pLimit(Math.min(os.cpus().length, DOWNLOAD_LIMIT_MAX)) // 下载并发数限制

@Injectable()
export class TasksService implements OnApplicationBootstrap {

    private readonly logger = new Logger(TasksService.name)

    // eslint-disable-next-line max-params
    constructor(
        private readonly scheduler: SchedulerRegistry,
        private readonly resourceService: ResourceService,
        @InjectRepository(Feed) private readonly feedRepository: Repository<Feed>,
        @InjectRepository(Article) private readonly articleRepository: Repository<Article>,
        @InjectRepository(Resource) private readonly resourceRepository: Repository<Resource>,
        @InjectRepository(WebhookLog) private readonly webhookLogRepository: Repository<WebhookLog>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
    ) { }

    onApplicationBootstrap() {
        this.initFeedTasks()
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
            feeds.forEach((feed) => {
                this.enableFeedTask(feed)
                // this.getRssContent(feed)
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
        const fid = feed.id
        const uid = feed.userId
        const url = feed.url
        const proxyUrl = feed.proxyConfig?.url
        try {
            if (!rss) {

                const resp = (await ajax({
                    url,
                    proxyUrl,
                    timeout: 60 * 1000,
                })).data
                rss = await rssParserString(resp)
            }
            if (Array.isArray(rss?.items)) {
                // 根据 guid 去重复 | 每个 user 的 不重复
                const guids = rss.items.map((e) => e.guid)
                const existingArticles = await this.articleRepository.find({
                    where: {
                        guid: In(guids),
                        userId: uid,
                    },
                    select: ['guid'],
                })
                const diffArticles = differenceWith(rss.items, existingArticles, (a, b) => a.guid === b.guid).map((item) => {
                    const article = rssItemToArticle(item)
                    article.feedId = fid
                    article.userId = uid
                    article.author = article.author || rss.author
                    return this.articleRepository.create(article)
                })

                if (diffArticles?.length) {
                    const newArticles = await this.articleRepository.save(diffArticles)
                    await this.triggerHooks(feed, newArticles)
                }
            }
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            await this.reverseTriggerHooks(feed, error)
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
        const hooks = (await this.feedRepository.findOne({ where: { id: feed.id }, relations: ['hooks'], select: ['hooks'] }))
            ?.hooks
            ?.filter((hook) => hook.isReversed && ['notification', 'webhook'].includes(hook.type), // 处理反转触发的 Hook；只触发 notification/webhook 类型的
            )

        if (!hooks?.length) {
            return
        }
        const userId = feed.userId
        const user = await this.userRepository.findOne({ where: { id: userId } })
        const isAdmin = user?.roles?.includes(Role.admin) // 只有 admin 用户可以看到 堆栈
        await Promise.allSettled(hooks.map(async (hook) => {
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
        await this.notification(hook, feed, title, desp)
    }

    private async notification(hook: Hook, feed: Feed, title: string, desp: string) {
        const userId = hook.userId
        const config = hook.config as NotificationConfig
        const proxyUrl = hook.proxyConfig?.url
        const { maxLength = 4096 } = config
        const webhookLog = this.webhookLogRepository.create({
            hookId: hook.id,
            userId,
            feedId: feed.id,
            status: 'unknown',
            type: 'notification',
        })
        try {
            this.logger.log(`正在执行推送渠道 ${config.type}`)
            const resp = await runPushAllInOne(title.slice(0, 256), desp.slice(0, maxLength || 4096), config, proxyUrl)
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
        const hooks = (await this.feedRepository.findOne({ where: { id: feed.id }, relations: ['hooks'], select: ['hooks'] }))// 拉取最新的 hook 配置
            ?.hooks
            ?.filter((hook) => !hook.isReversed) // 排除反转触发的
        if (!hooks?.length || !articles?.length) {
            return
        }
        // try {
        await Promise.allSettled(hooks
            .map(async (hook) => {
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
                        // 下载并发数是全局的，所以需要从外部传入
                        await this.downloadHook(hook, feed, filteredArticles, downloadLimit)
                        return
                    }
                    case 'bitTorrent': {
                        await this.bitTorrentHook(hook, feed, filteredArticles)
                        return
                    }
                    default:
                        this.logger.warn('未匹配到任何类型的Hook！')

                }
            }),
        )
        // } catch (error) {
        //     this.logger.error(error?.message, error?.stack)
        // }
    }

    private async notificationHook(hook: Hook, feed: Feed, articles: Article[]) {
        const config = hook.config as NotificationConfig
        const { isMergePush = false, isMarkdown = false, isSnippet = false, maxLength = 4096 } = config
        const title = `检测到【 ${feed.title} 】有更新`
        const notifications: { title: string, desp: string }[] = []
        if (isMergePush) {
            // 合并推送
            const desp = articlesFormat(articles, { isMarkdown, isSnippet })
            // 如果过长，则考虑分割推送，但至多不超过 5 条
            const chunks = splitString(desp, maxLength).slice(0, 5) // 分割字符串
            chunks.forEach((chunk) => {
                notifications.push({
                    title,
                    desp: chunk,
                })
            })
        } else {
            // 逐条推送
            articles.forEach((article) => {
                const { text: desp, title: itemTitle } = articleItemFormat(article, { isMarkdown, isSnippet })
                // 如果过长，则考虑分割推送，但至多不超过 3 条
                const chunks = splitString(desp, maxLength).slice(0, 3) // 分割字符串
                chunks.forEach((chunk) => {
                    notifications.push({
                        title: itemTitle,
                        desp: chunk,
                    })
                })
            })
        }

        await Promise.allSettled(notifications.map(async (notification) => {
            await this.notification(hook, feed, notification.title, notification.desp)
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

    // eslint-disable-next-line @typescript-eslint/no-shadow
    private async downloadHook(hook: Hook, feed: Feed, articles: Article[], downloadLimit: pLimit.Limit) {
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
        await Promise.allSettled(allUrls.map((url) => downloadLimit(async () => {
            const ext = path.extname(url)
            const hashname = md5(url)
            const filename = hashname + ext
            const filepath = path.resolve(path.join(dirPath, filename))
            this.logger.debug(`正在检测文件: ${filename}`)
            // 如果在数据库里
            let resource = await this.resourceRepository.findOne({
                where: { url, userId },
            })
            if (resource) {
                this.logger.debug(`文件 ${filename} 已存在，跳过下载`)
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
                this.logger.debug(`文件 ${filename} 下载成功`)
                return
            }

            if (await fs.pathExists(filepath)) { // 如果已经下载了，则跳过
                this.logger.debug(`文件 ${filename} 已存在，跳过下载`)
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
                this.logger.debug(`正在下载文件: ${filename}`)
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

        })))
    }

    private async bitTorrentHook(hook: Hook, feed: Feed, articles: Article[]) {
        const userId = hook.userId
        const config = hook.config as BitTorrentConfig
        const proxyUrl = hook.proxyConfig?.url
        const { type } = config
        const btArticles = articles.filter((article) => article.enclosure?.type === 'application/x-bittorrent' && article.enclosure?.url) // 排除BT以外的
        if (!btArticles?.length) {
            return
        }
        switch (type) {
            case 'qBittorrent': {
                const { baseUrl, username, password, downloadPath, maxSize } = config
                const qBittorrent = new QBittorrent({
                    baseUrl,
                    username,
                    password,
                    timeout: 60 * 1000,
                })
                await Promise.allSettled(btArticles.map(async (article) => {
                    const url = article.enclosure.url
                    let hash = ''
                    let magnetUri = ''
                    let name = ''
                    let size = 0
                    let magnet: Instance & { xl?: number }
                    // 如果是 magnet，则直接添加 磁力链接
                    if (/^magnet:/.test(url)) {
                        magnet = parseTorrent(url) as Instance
                        hash = magnet.infoHash?.toLowerCase()
                        if (await this.resourceRepository.findOne({ where: { hash, userId } })) {
                            this.logger.debug(`资源 ${url} 已存在，跳过该资源下载`)
                            return
                        }
                        await qBittorrent.addMagnet(url, { savepath: downloadPath })
                    } else if (isHttpURL(url)) {  // 如果是 http，则下载 bt 种子
                        if (await this.resourceRepository.findOne({ where: { url, userId } })) {
                            this.logger.debug(`资源 ${url} 已存在，跳过该资源下载`)
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
                        if (await this.resourceRepository.findOne({ where: { hash, userId } })) {
                            this.logger.debug(`资源 ${magnetUri} 已存在，跳过该资源下载`)
                            return
                        }
                        await qBittorrent.addTorrent(torrent, { savepath: downloadPath })
                    }

                    if (/^(https?:\/\/|magnet:)/.test(url)) {
                        name = magnet.name || magnet.dn as string
                        if (magnet.length) {
                            size = magnet.length
                        } else if (magnet.xl) {
                            size = Number(magnet.xl)
                        }
                        if (size === 1) { // 如果 length 为 1 ，则重新获取真实大小。例如：动漫花园 rss
                            size = 0
                            article.enclosure.length = 0
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
                        if (newResource.size > 0 && !article.enclosure.length) {
                            article.enclosure.length = newResource.size // 更新附件大小
                            article.enclosure = plainToInstance(EnclosureImpl, article.enclosure)
                            await this.articleRepository.save(article)
                        }
                        if (isSafePositiveInteger(maxSize) && maxSize > 0 && newResource.size > 0 && maxSize <= newResource.size) {
                            this.logger.warn(`资源 ${magnetUri} 的大小超过限制，跳过该资源下载`)
                            await qBittorrent.removeTorrent(hash) // 移除超过限制的资源
                            newResource.status = 'skip'
                            await this.resourceRepository.save(newResource)
                            return
                        }
                        // 由于 磁力链接没有元数据，因此在 qBittorrent 解析前不知道其大小
                        // 如果从种子解析出的 size 为空，则应该在 qBittorrent 解析后再次校验大小
                        if (!newResource.size || newResource.size <= 0) {
                            setTimeout(async () => {
                                let i = 0
                                do {
                                    size = await this.updateTorrentInfo(qBittorrent, config, newResource, article)
                                    if (size > 0 || size === -1) {
                                        break
                                    }
                                    i++
                                    await sleep(60 * 1000) // 等待 60 秒后更新 元数据，至多重试 5 次
                                } while (i > 5)
                            }, 0)
                        }
                        return
                    }
                    this.logger.error(`不支持的 资源类型：${url}`)
                }))
                return
            }

            default:
                throw new Error(`不支持的BT下载器类型: ${type}`)
        }
    }

    /**
     * 更新 BT 资源信息
     *
     * @author CaoMeiYouRen
     * @date 2024-04-14
     */
    private async updateTorrentInfo(qBittorrent: QBittorrent, config: BitTorrentConfig, resource: Resource, article: Article) {
        const { url } = article.enclosure
        const { maxSize } = config
        const { hash } = resource
        const [error, torrentInfo] = await to(qBittorrent.getTorrent(hash))
        if (error) {
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
        if (resource.size > 0 && !article.enclosure.length) {
            article.enclosure.length = resource.size // 更新附件大小
            article.enclosure = plainToInstance(EnclosureImpl, article.enclosure)
            await this.articleRepository.save(article)
        }
        if (isSafePositiveInteger(maxSize) && maxSize > 0 && resource.size > 0 && maxSize <= resource.size) {
            this.logger.warn(`资源 ${magnetUri} 的大小超过限制，跳过该资源下载`)
            await qBittorrent.removeTorrent(hash) // 移除超过限制的资源
            resource.status = 'skip'
            await this.resourceRepository.save(resource)
            return -1
        }
        switch (torrentInfo.state) {
            case 'error':
                resource.status = 'fail'
                break
            case 'warning':
                resource.status = 'fail'
                break
            case 'downloading':
                resource.status = 'success'
                break
            case 'seeding': // 如果是做种后完成的话，也是 seeding 状态
                resource.status = 'success'
                break
            // case 'paused':
            //     resource.status = 'success'
            //     break
            // case 'queued':
            //     resource.status = 'success'
            //     break
            // case 'checking':
            //     resource.status = 'success'
            //     break
            default: // paused/queued/checking/unknown
                resource.status = 'unknown'
                break
        }
        await this.resourceRepository.save(resource) // 更新状态
        return resource.size
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
                        const maxDelay = __DEV__ ? 1000 : 30 * 1000
                        this.logger.log(`rss ${feed.url} 已进入订阅队列`)
                        await randomSleep(0, maxDelay)
                        this.logger.log(`rss ${feed.url} 正在检测更新中……`)
                        await this.getRssContent(feed)
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
            this.logger.debug(`定时任务 ${name} 已删除`)
            return true
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            return false
        }
    }

    private addCronJob(name: string, job: CronJob) {
        try {
            this.scheduler.addCronJob(name, job)
            this.logger.debug(`定时任务 ${name} 已新增`)
            return true
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
            return false
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'removeArticles' }) // 每天删除一次
    private async removeArticles() {
        try {
            this.logger.log('开始移除过时的文章')
            const date = dayjs().add(-ARTICLE_SAVE_DAYS, 'day').toDate()
            const removes = await this.articleRepository.delete({
                // pubDate: LessThan(date),
                createdAt: LessThan(date),
            })
            this.logger.log('成功移除过时的文章')
            this.logger.log(removes)
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'removeResources' }) // 每天删除一次
    private async removeResources() {
        try {
            this.logger.log('开始移除过时的资源')
            const date = dayjs().add(-RESOURCE_SAVE_DAYS, 'day').toDate()
            const removes = await this.resourceRepository.delete({
                createdAt: LessThan(date),
            })
            this.logger.log('成功移除过时的资源')
            this.logger.log(removes)
            // 清理真实的文件
            const dirPath = path.resolve(RESOURCE_DOWNLOAD_PATH) // 解析为绝对路径
            const files = await fs.readdir(dirPath)
            const removeLimit = pLimit(Math.min(os.cpus().length, 8)) // 删除 limit
            await Promise.allSettled(files.map((file) => {
                if (/\.(sqlite|db)$/.test(file)) { // 防止把 download 的 path 设置成跟 data 一样，把数据库删了
                    return null
                }
                return removeLimit(async () => {
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
            }))
        } catch (error) {
            this.logger.error(error?.message, error?.stack)
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'removeLogs' }) // 每天删除一次
    private async removeLogs() {
        try {
            this.logger.log('开始移除过时的日志')
            const date = dayjs().add(-LOG_SAVE_DAYS, 'day').toDate()
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
}
