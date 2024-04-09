import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsUrl, Length, ValidateIf } from 'class-validator'
import { PushAllInOneConfig } from '@/interfaces/push-type'
import { AjaxConfig } from '@/utils/ajax'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { IsSafePositiveInteger } from '@/decorators/is-safe-integer.decorator'

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
    // dirPath: string

    /**
     * 超时时间(秒)
     */
    timeout?: number
}

export class BitTorrentConfig {

    @SetAclCrudField({
        type: 'select',
        dicData: ['qBittorrent'].map((e) => ({
                label: e,
                value: e,
            })),
        search: true,
        value: 'qBittorrent',
    })
    @ApiProperty({ title: '类型', description: 'BT下载器类型。目前仅支持 qBittorrent', example: 'qBittorrent' })
    @Length(0, 16)
    @IsIn(['qBittorrent'])
    @IsNotEmpty()
    type: 'qBittorrent'

    @ApiProperty({ title: '服务器地址', description: 'BT服务器地址，例如 http://localhost:8080/', example: 'http://localhost:8080/' })
    @IsUrl()
    @Length(0, 1024)
    baseUrl: string

    @ApiProperty({ title: '用户名', example: 'admin' })
    @IsNotEmpty()
    @Length(0, 128)
    username: string

    @ApiProperty({ title: '密码', example: 'adminadmin' })
    @IsNotEmpty()
    @Length(0, 128)
    password: string

    @ApiProperty({ title: '下载路径', example: '服务器上的地址，要保存到的路径。留空则为 BT 下载器的默认设置' })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.downloadPath !== 'undefined')
    downloadPath?: string

    @ApiProperty({ title: '最大体积(B)', description: '过滤资源体积，超过体积的资源不会下载。单位为 B (字节)。设置为 0 禁用', example: 114514 })
    @IsSafePositiveInteger()
    @ValidateIf((o) => typeof o.maxSize !== 'undefined')
    maxSize?: number
}

export type HookConfig = NotificationConfig | WebhookConfig | DownloadConfig | BitTorrentConfig
