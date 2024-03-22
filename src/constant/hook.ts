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
