import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { CronJob } from 'cron'
import { differenceWith } from 'lodash'
import { Feed } from '@/db/models/feed.entity'
import { RssCronList } from '@/constant/rss-cron'
import { __DEV__, TZ } from '@/app.config'
import { randomSleep } from '@/utils/helper'
import { rssItemToArticle, rssParserURL } from '@/utils/rss-helper'
import { Article } from '@/db/models/article.entity'

@Injectable()
export class TasksService implements OnApplicationBootstrap {

    private readonly logger = new Logger(TasksService.name)

    constructor(
        private scheduler: SchedulerRegistry,
        @InjectRepository(Feed) private readonly feedRepository: Repository<Feed>,
        @InjectRepository(Article) private readonly articleRepository: Repository<Article>,
    ) { }

    onApplicationBootstrap() {
        this.initFeedTasks()
    }

    private getAllFeeds() {
        return this.feedRepository.find({
            where: {
                isEnabled: true,
            },
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
            await this.articleRepository.save(diffArticles)
            // TODO。此处要触发 Hook
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
                        await this.disableFeedTask(feed)
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
