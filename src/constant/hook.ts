export const HookMap = {
    notification: '推送通知',
    webhook: 'Webhook',
    download: '下载',
    bitTorrent: 'BitTorrent', // /磁力链接
    aiSummary: 'AI 大模型',
    regular: '正则替换',
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
} as const

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
} as const

export const LogStatusList = Object.entries(LogStatusMap).map(([value, label]) => ({
    label,
    value,
}))

export type LogStatusType = keyof typeof LogStatusMap

export const BitTorrentMap = {
    qBittorrent: 'qBittorrent',
} as const

export const BitTorrentList = Object.entries(BitTorrentMap).map(([value, label]) => ({
    label,
    value,
}))

export type BitTorrentType = keyof typeof BitTorrentMap

export const AIMap = {
    openAI: 'OpenAI',
} as const

export const AIList = Object.entries(AIMap).map(([value, label]) => ({
    label,
    value,
}))

export type AIType = keyof typeof AIMap

export const AIActionMap = {
    summary: '总结',
    generateCategory: '生成分类',
}

export const AIActionList = Object.entries(AIActionMap).map(([value, label]) => ({
    label,
    value,
}))

export type AIActionType = keyof typeof AIActionMap

export const ContentMap = {
    text: '纯文本',
    html: 'HTML',
} as const

export const ContentList = Object.entries(ContentMap).map(([value, label]) => ({
    label,
    value,
}))

export type ContentType = keyof typeof ContentMap
