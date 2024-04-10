import { PushAllInOneConfig } from '@/interfaces/push-type'
import { BitTorrentConfig } from '@/models/bit-torrent-config'
import { DownloadConfig } from '@/models/download-config'
import { WebhookConfig } from '@/models/webhook-config'

export const HookMap = {
    notification: '推送通知',
    webhook: 'Webhook',
    download: '下载',
    bitTorrent: 'BitTorrent', // /磁力链接
} as const

export const HookList = Object.entries(HookMap).map(([value, label]) => ({
    label,
    value,
}))

export type HookType = keyof typeof HookMap

export const StatusMap = {
    success: '成功',
    fail: '失败',
    skip: '跳过',
    unknown: '未知',
}

export const StatusList = Object.entries(StatusMap).map(([value, label]) => ({
    label,
    value,
}))

export type StatusType = keyof typeof StatusMap

export const LogTypeMap = {
    notification: '推送通知',
    webhook: 'Webhook',
} as const

export const LogTypeList = Object.entries(LogTypeMap).map(([value, label]) => ({
    label,
    value,
}))

export type LogType = keyof typeof LogTypeMap

export const LogStatusMap = {
    success: '成功',
    fail: '失败',
    unknown: '未知',
}

export const LogStatusList = Object.entries(LogStatusMap).map(([value, label]) => ({
    label,
    value,
}))

export type LogStatusType = keyof typeof LogStatusMap

export type NotificationConfig = PushAllInOneConfig & {
    /**
     * 是否合并推送
     */
    isMergePush: boolean
    /**
     * 是否用 Markdown 格式推送
     */
    isMarkdown: boolean

    /**
    * 是否为 纯文本（去除 HTML）
    */
    isSnippet: boolean
    /**
     * 一次推送的最大长度
     */
    maxLength: number
}

export type HookConfig = NotificationConfig | WebhookConfig | DownloadConfig | BitTorrentConfig

