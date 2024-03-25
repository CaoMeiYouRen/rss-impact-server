import { PushAllInOneConfig } from '@/interfaces/push-type'
import { AjaxConfig } from '@/utils/ajax'

export const HookMap = {
    notification: '推送通知',
    webhook: 'Webhook',
    download: '下载',
    bitTorrent: 'BitTorrent/磁力链接',
} as const

export const HookList = Object.entries(HookMap).map(([value, label]) => ({
    label,
    value,
}))

export type HookType = keyof typeof HookMap

export type NotificationConfig = PushAllInOneConfig & {
    /**
     * 是否合并推送
     */
    isMergePush: boolean
}

export type WebhookConfig = AjaxConfig

export type DownloadConfig = {
    /**
     * 要下载的文件的后缀名，支持正则 .(jpe?g|png|gif|webp|bmp)$
     */
    suffixes: string

    /**
     * 要跳过的文件 md5 逗号分割
     */
    skipHashes: string
    /**
     * 下载到的路径
     */
    dirPath: string

    /**
     * 超时时间(秒)
     */
    timeout?: number
}

export type BitTorrentConfig = {
    /**
     * BT下载器类型，目前仅支持 qBittorrent
     */
    type: 'qBittorrent'
    /**
     * 服务器地址
     */
    host: string
    /**
     * 端口
     */
    port: number
    /**
     * 用户名
     */
    username: string
    /**
     * 密码
     */
    password: string
    /**
     * 下载路径
     */
    downloadPath: string
    /**
     * 使用 HTTPS 而不是 HTTP
     */
    useHttps: boolean
}

export type HookConfig = NotificationConfig | WebhookConfig | DownloadConfig | BitTorrentConfig
