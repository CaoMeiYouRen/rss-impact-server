import os from 'os'
import path from 'path'
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { CronJob } from 'cron'
import { differenceWith, flattenDeep } from 'lodash'
import XRegExp from 'xregexp'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import pLimit from 'p-limit'
import md5 from 'md5'
import FileType from 'file-type'
import { Feed } from '@/db/models/feed.entity'
import { RssCronList } from '@/constant/rss-cron'
import { __DEV__, TZ } from '@/app.config'
import { getAllUrls, randomSleep, download, getMd5ByStream } from '@/utils/helper'
import { rssItemToArticle, rssParserURL } from '@/utils/rss-helper'
import { Article } from '@/db/models/article.entity'
import { Hook } from '@/db/models/hook.entity'
import { BitTorrentConfig, DownloadConfig, NotificationConfig, WebhookConfig } from '@/constant/hook'
import { ajax } from '@/utils/ajax'
import { Resource } from '@/db/models/resource.entiy'

@Injectable()
export class TasksService implements OnApplicationBootstrap {

    private readonly logger = new Logger(TasksService.name)

    constructor(
        private scheduler: SchedulerRegistry,
        @InjectRepository(Feed) private readonly feedRepository: Repository<Feed>,
        @InjectRepository(Article) private readonly articleRepository: Repository<Article>,
        @InjectRepository(Hook) private readonly hookRepository: Repository<Hook>,
        @InjectRepository(Resource) private readonly resourceRepository: Repository<Resource>,
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
        const userId = feed.userId
        const filterFields = ['title', 'summary', 'author', 'categories']
        try {
            const downloadLimit = pLimit(os.cpus().length) // 下载并发数
            await Promise.allSettled(hooks
                .map(async (hook) => {
                    const filteredArticles = articles
                        .filter((article) => {
                            if (!article.publishDate || !hook.filter.time) { // 没有 publishDate/filter.time 不受过滤时间限制
                                return true
                            }
                            return dayjs().diff(article.publishDate, 'second') <= hook.filter.time
                        })
                        // TODO 考虑增加 filterout 功能
                        .filter((article) => filterFields.every((field) => { // 所有条件为 交集，即 需要全部符合
                            if (!hook.filter[field] || !article[field]) { // 如果缺少 filter 或 article 对应的项就跳过该过滤条件
                                return true
                            }
                            if (field === 'categories') {
                                // 有一个 category 对的上就为 true
                                return article[field].some((category) => XRegExp(hook.filter[field], 'ig').test(category))
                            }
                            return XRegExp(hook.filter[field], 'ig').test(article[field])
                        }),
                        )
                        .slice(0, hook.filter.limit || 20) // 默认最多 20 条
                    if (!filteredArticles?.length) {
                        return
                    }
                    switch (hook.type) {
                        case 'notification': {
                            // push all in one
                            const config = hook.config as NotificationConfig
                            return
                        }
                        case 'webhook': {
                            const config = hook.config as WebhookConfig
                            const resp = await ajax({
                                ...config,
                                data: filteredArticles as any,
                            })
                            // TODO 记录 webhook 执行结果
                            return
                        }
                        case 'download': {
                            const config = hook.config as DownloadConfig
                            const skipHashes = config.skipHashes.split(',').map((e) => e.trim())
                            // TODO 如果下载的路径可以随意修改，似乎会引起一些问题
                            const { suffixes, dirPath = './data/download', timeout = 60 } = config
                            const allUrls = flattenDeep(filteredArticles
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
                                this.logger.log(`正在下载文件: ${filename}`)
                                // 如果在数据库里
                                const resource = await this.resourceRepository.findOne({
                                    where: { url },
                                })
                                if (resource) {
                                    this.logger.debug(`文件 ${filename} 已存在，跳过下载`)
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
                                        path: filepath,
                                        status: 'success',
                                        size: stat.size,
                                        type: mime,
                                        hash,
                                    })
                                    await this.resourceRepository.save(newResource)
                                    return
                                }
                                const newResource = this.resourceRepository.create({
                                    url,
                                    path: filepath,
                                    status: 'unknown',
                                })
                                try {
                                    // 由于 hash 只能在下载后计算得出，所以第一次下载依旧会下载整个文件
                                    const fileInfo = await download(url, filepath, timeout * 1000)
                                    newResource.type = fileInfo.type
                                    newResource.size = fileInfo.size
                                    newResource.hash = fileInfo.hash
                                    if (skipHashes.includes(fileInfo.hash)) {
                                        newResource.status = 'ban'
                                        await fs.remove(filepath) // 移除被 ban 的文件
                                        newResource.path = ''
                                        this.logger.log(`文件 ${filename} 在 skipHashes 内，已删除`)
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
                            return
                        }
                        case 'bitTorrent': {
                            const config = hook.config as BitTorrentConfig
                            return
                        }
                        default:
                            this.logger.warn('未匹配到任何类型的Hook！')

                    }
                }),
            )
        } catch (error) {
            this.logger.error(error)
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
