import os from 'os'
import path from 'path'
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { CronJob } from 'cron'
import { differenceWith, flattenDeep, pick } from 'lodash'
import XRegExp from 'xregexp'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import pLimit from 'p-limit'
import md5 from 'md5'
import FileType from 'file-type'
import { QBittorrent } from '@cao-mei-you-ren/qbittorrent'
import torrent2magnet from 'torrent2magnet-js'
import { ResourceService } from '@/services/resource/resource.service'
import { Feed } from '@/db/models/feed.entity'
import { RssCronList } from '@/constant/rss-cron'
import { __DEV__, DOWNLOAD_LIMIT_MAX, RESOURCE_DOWNLOAD_PATH, TZ } from '@/app.config'
import { getAllUrls, randomSleep, download, getMd5ByStream, getMagnetUri, timeFormat } from '@/utils/helper'
import { articleItemFormat, articlesFormat, rssItemToArticle, rssParserURL } from '@/utils/rss-helper'
import { Article } from '@/db/models/article.entity'
import { Hook } from '@/db/models/hook.entity'
import { BitTorrentConfig, DownloadConfig, NotificationConfig, WebhookConfig } from '@/constant/hook'
import { ajax } from '@/utils/ajax'
import { Resource } from '@/db/models/resource.entiy'
import { WebhookLog } from '@/db/models/webhook-log.entity'
import { runPushAllInOne } from '@/utils/notification'
import { isSafePositiveInteger } from '@/decorators/is-safe-integer.decorator'
import { User } from '@/db/models/user.entity'
import { Role } from '@/constant/role'

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
            // relations: ['hooks'],
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
            this.logger.error(error)
        }
    }

    /**
     * 获取 RSS
     *
     * @author CaoMeiYouRen
     * @date 2024-03-21
     * @param feed
     */
    private async getRssContent(feed: Feed) {
        const fid = feed.id
        const uid = feed.userId
        const url = feed.url

        try {
            const rss = await rssParserURL(url)
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
            this.logger.error(error)
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
            const resp = await runPushAllInOne(title.slice(0, 256), desp.slice(0, maxLength), config)
            await this.webhookLogRepository.save(this.webhookLogRepository.create({
                ...webhookLog,
                ...pick(resp, ['data', 'statusText', 'headers']),
                status: 'success',
                statusCode: resp.status,
            }))
            this.logger.log(`执行推送渠道 ${config.type} 成功`)
        } catch (error) {
            this.logger.error(error)
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
        const hooks = (await this.feedRepository.findOne({ where: { id: feed.id }, relations: ['hooks'], select: ['hooks'] }))?.hooks // 拉取最新的 hook 配置
        if (!hooks?.length || !articles?.length) {
            return
        }
        const filterFields = ['title', 'summary', 'author', 'categories']
        // try {
        await Promise.allSettled(hooks
            .map(async (hook) => {
                const filteredArticles = articles
                    .filter((article) => {
                        if (!article.publishDate || !hook.filter.time) { // 没有 publishDate/filter.time 不受过滤时间限制
                            return true
                        }
                        return dayjs().diff(article.publishDate, 'second') <= hook.filter.time
                    })
                    // 先判断 filterout
                    .filter((article) => filterFields.some((field) => { // 所有条件为 并集，即 符合一个就排除
                        if (!hook.filterout[field] || !article[field]) { // 如果缺少 filter 或 article 对应的项就跳过该过滤条件
                            return true
                        }
                        if (field === 'categories') {
                            // 有一个 category 对的上就 排除
                            return !article[field].some((category) => XRegExp(hook.filterout[field], 'ig').test(category))
                        }
                        return !XRegExp(hook.filterout[field], 'ig').test(article[field])
                    }))
                    // 再判断 filter
                    .filter((article) => filterFields.every((field) => { // 所有条件为 交集，即 需要全部符合
                        if (!hook.filter[field] || !article[field]) { // 如果缺少 filter 或 article 对应的项就跳过该过滤条件
                            return true
                        }
                        if (field === 'categories') {
                            // 有一个 category 对的上就为 true
                            return article[field].some((category) => XRegExp(hook.filter[field], 'ig').test(category))
                        }
                        return XRegExp(hook.filter[field], 'ig').test(article[field])
                    }))
                    .slice(0, hook.filter.limit || 20) // 默认最多 20 条
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
        //     this.logger.error(error)
        // }
    }

    private async notificationHook(hook: Hook, feed: Feed, articles: Article[]) {
        const config = hook.config as NotificationConfig
        const { isMergePush = false, isMarkdown = false, isSnippet = false } = config
        const title = `检测到【 ${feed.title} 】有更新`
        const notifications: { title: string, desp: string }[] = []
        if (isMergePush) {
            // 合并推送
            notifications.push({
                title,
                desp: articlesFormat(articles, { isMarkdown, isSnippet }),
            })
        } else {
            // 逐条推送
            notifications.push(
                ...articles.map((article) => {
                    const { text: desp, title: itemTitle } = articleItemFormat(article, { isMarkdown, isSnippet })
                    return {
                        title: itemTitle,
                        desp,
                    }
                }))
        }
        // TODO 如果过长，则考虑分割推送
        await Promise.allSettled(notifications.map(async (notification) => {
            await this.notification(hook, feed, notification.title, notification.desp)
        }))
    }

    private async webhook(hook: Hook, feed: Feed, data: Article[] | any) {
        const userId = hook.userId
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
            this.logger.error(error)
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
                const fileInfo = await download(url, filepath, timeout * 1000)
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
                this.logger.error(error)
            } finally {
                await this.resourceRepository.save(newResource)
            }

        })))
    }

    private async bitTorrentHook(hook: Hook, feed: Feed, articles: Article[]) {
        const userId = hook.userId
        const config = hook.config as BitTorrentConfig
        const { type } = config
        const btArticles = articles.filter((article) => article.enclosure?.type === 'application/x-bittorrent' && article.enclosure?.url) // 排除BT以外的
        if (!btArticles?.length) {
            return
        }
        const urls = btArticles.map((article) => article.enclosure.url)
        switch (type) {
            case 'qBittorrent': {
                const { baseUrl, username, password, downloadPath, maxSize } = config
                const qBittorrent = new QBittorrent({
                    baseUrl,
                    username,
                    password,
                    timeout: 60 * 1000,
                })
                await Promise.allSettled(urls.map(async (url) => {
                    // 如果是 magnet，则直接添加 磁力链接
                    if (url.startsWith('magnet:')) {
                        await qBittorrent.addMagnet(url, { savepath: downloadPath })
                        const reg = /urn:btih:(.{40})/
                        const hash = reg.exec(url)?.[1]?.toLowerCase()
                        const magnetUri = getMagnetUri(hash) // 磁力链接
                        if (await this.resourceRepository.findOne({ where: { hash, userId } })) {
                            this.logger.debug(`资源 ${magnetUri} 已存在，跳过该资源下载`)
                            return
                        }
                        const resource = this.resourceRepository.create({
                            url: magnetUri,
                            path: '',
                            status: 'unknown',
                            hash,
                            userId,
                        })
                        const newResource = await this.resourceRepository.save(resource)
                        // 由于 磁力链接没有元数据，因此在 qBittorrent 解析前不知道其大小
                        setTimeout(async () => {
                            const torrentInfo = await qBittorrent.getTorrent(hash)
                            const tracker = torrentInfo.raw?.tracker
                            const newMagnetUri = getMagnetUri(hash, tracker) // 磁力链接
                            newResource.url = newMagnetUri
                            newResource.name = torrentInfo.name
                            newResource.size = torrentInfo.totalSize // 总大小
                            if (isSafePositiveInteger(maxSize) && maxSize > 0 && maxSize <= torrentInfo.totalSize) {
                                this.logger.warn(`资源 ${magnetUri} 的大小超过限制，跳过该资源下载`)
                                await qBittorrent.removeTorrent(hash) // 移除超过限制的资源
                                newResource.status = 'skip'
                                await this.resourceRepository.save(newResource)
                                return
                            }
                            switch (torrentInfo.state) {
                                case 'error':
                                    newResource.status = 'fail'
                                    break
                                case 'warning':
                                    newResource.status = 'fail'
                                    break
                                case 'downloading':
                                    newResource.status = 'success'
                                    break
                                case 'seeding': // 如果是做种后完成的话，也是 seeding 状态
                                    newResource.status = 'success'
                                    break
                                default: // paused/queued/checking/unknown
                                    newResource.status = 'unknown'
                                    break
                            }
                            await this.resourceRepository.save(resource) // 更新状态
                        }, 60 * 1000) // 等待 60 秒后更新 元数据
                        // TODO 优化更新元数据逻辑
                        return
                    }
                    // 如果是 http，则下载 bt 种子
                    if (/^(https?:\/\/)/.test(url)) {
                        if (await this.resourceRepository.findOne({ where: { url, userId } })) {
                            this.logger.debug(`资源 ${url} 已存在，跳过该资源下载`)
                            return
                        }
                        const resp = await ajax<ArrayBuffer>({
                            url,
                            responseType: 'arraybuffer',
                            timeout: 60 * 1000,
                        })
                        const torrent = new Uint8Array(resp.data)
                        const magnet = torrent2magnet(torrent)
                        const hash = magnet.infohash.toLowerCase() // hash
                        const magnetUri = getMagnetUri(hash, magnet.main_tracker)
                        if (await this.resourceRepository.findOne({ where: { hash, userId } })) {
                            this.logger.debug(`资源 ${magnetUri} 已存在，跳过该资源下载`)
                            return
                        }
                        const newResource = this.resourceRepository.create({
                            url, // 保存 bt 种子链接，避免每次都要下载种子
                            name: magnet.dn, // 名称
                            path: '', // 文件在服务器上的地址，没有必要，故统一留空
                            status: 'unknown',
                            size: magnet.xl,  // 体积大小
                            type: 'application/x-bittorrent',
                            hash,
                            userId,
                        })
                        // TODO 如果从种子解析出的 size 为空，则应该在 qBittorrent 解析后再次校验大小
                        if (isSafePositiveInteger(maxSize) && maxSize > 0 && maxSize <= magnet.xl) {
                            this.logger.warn(`资源 ${magnetUri} 的大小超过限制，跳过该资源下载`)
                            newResource.status = 'skip'
                            await this.resourceRepository.save(newResource)
                            return
                        }
                        const status = await qBittorrent.addTorrent(torrent, { savepath: downloadPath })
                        newResource.status = status ? 'success' : 'fail'
                        await this.resourceRepository.save(newResource)
                    }
                }))
                return
            }

            default:
                throw new Error(`不支持的BT下载器类型: ${type}`)
        }
    }

    async enableFeedTask(feed: Feed) {
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
                        this.logger.error(error)
                        // 如果出现异常就停止 该 rss
                        // await this.disableFeedTask(feed)
                    }
                },
            })
            this.addCronJob(name, job)
            this.logger.log(`定时任务 ${name}(${cronTime}) 已启动`)
        } catch (error) {
            this.logger.error(error)
        }
    }

    async disableFeedTask(feed: Feed) {
        const name = `feed_${feed.id}`
        try {
            await this.feedRepository.update({ id: feed.id }, { isEnabled: false })
            this.deleteCronJob(name)
        } catch (error) {
            this.logger.error(error)
        }
    }

    private getCronJob(name: string) {
        try {
            return this.scheduler.getCronJob(name)
        } catch (error) {
            this.logger.error(error)
            return null
        }
    }

    private deleteCronJob(name: string) {
        try {
            this.scheduler.deleteCronJob(name)
            this.logger.debug(`定时任务 ${name} 已删除`)
            return true
        } catch (error) {
            this.logger.error(error)
            return false
        }
    }

    private addCronJob(name: string, job: CronJob) {
        try {
            this.scheduler.addCronJob(name, job)
            this.logger.debug(`定时任务 ${name} 已新增`)
            return true
        } catch (error) {
            this.logger.error(error)
            return false
        }
    }
}
