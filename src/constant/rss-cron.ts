export const RssCron = {
    // CUSTOM: {
    //     label: '自定义时间',
    //     cron: '',
    // },
    EVERY_10_MINUTES: {
        label: '每10分钟',
        cron: '0 */10 * * * *',
    },
    EVERY_20_MINUTES: {
        label: '每20分钟',
        cron: '0 */20 * * * *',
    },
    EVERY_30_MINUTES: {
        label: '每30分钟',
        cron: '0 */30 * * * *',
    },
    EVERY_1_HOUR: {
        label: '每1小时',
        cron: '0 0-23/1 * * *',
    },
    EVERY_2_HOURS: {
        label: '每2小时',
        cron: '0 0-23/2 * * *',
    },
    EVERY_3_HOURS: {
        label: '每3小时',
        cron: '0 0-23/3 * * *',
    },
    EVERY_4_HOURS: {
        label: '每4小时',
        cron: '0 0-23/4 * * *',
    },
    EVERY_6_HOURS: {
        label: '每6小时',
        cron: '0 0-23/6 * * *',
    },
    EVERY_8_HOURS: {
        label: '每8小时',
        cron: '0 0-23/8 * * *',
    },
    EVERY_12_HOURS: {
        label: '每12小时',
        cron: '0 0-23/12 * * *',
    },
    EVERY_DAY: {
        label: '每天0点',
        cron: '0 0 * * *', // 每天0点
    },
} as const

// : Record<string, {
//     label: string
//     cron: string
// }>

export const RssLabelList = Object.entries(RssCron).map(([value, label]) => ({
    label: label.label,
    value,
}))

export const RssCronList = Object.entries(RssCron).map(([value, label]) => ({
    label: label.cron,
    value,
}))

export type RssCronType = keyof (typeof RssCron)
