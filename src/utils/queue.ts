import os from 'os'
import PQueue from 'p-queue'
import { RSS_LIMIT_MAX, HOOK_LIMIT_MAX, DOWNLOAD_LIMIT_MAX, AI_LIMIT_MAX, BIT_TORRENT_LIMIT_MAX, NOTIFICATION_LIMIT_MAX } from '@/app.config'

export const removeQueue = new PQueue({ concurrency: Math.min(os.cpus().length, 8) }) // 删除文件并发数
export const rssQueue = new PQueue({ concurrency: RSS_LIMIT_MAX }) // RSS 请求并发数
export const hookQueue = new PQueue({ concurrency: HOOK_LIMIT_MAX }) // Hook 并发数
export const downloadQueue = new PQueue({ concurrency: DOWNLOAD_LIMIT_MAX }) // 下载并发数限制
export const aiQueue = new PQueue({ concurrency: AI_LIMIT_MAX }) // AI 总结并发数
export const bitTorrentQueue = new PQueue({ concurrency: BIT_TORRENT_LIMIT_MAX }) // BitTorrent 并发数
export const notificationQueue = new PQueue({ concurrency: NOTIFICATION_LIMIT_MAX }) // 推送 并发数
