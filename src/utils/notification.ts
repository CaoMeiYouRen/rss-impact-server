import { runPushAllInOne as $runPushAllInOne } from 'push-all-in-one'
import { mdToCqcode } from './helper'
import { NotificationConfig } from '@/models/notification-config'

/**
 * 从传入变量中读取配置，并选择一个渠道推送
 *
 * @author CaoMeiYouRen
 * @date 2023-10-25
 * @export
 * @param title
 * @param desp
 * @param pushConfig
 */
export async function runPushAllInOne(title: string, desp: string, pushConfig: NotificationConfig, proxyUrl?: string) {
    const { isMarkdown, type, config, option } = pushConfig
    // if (isMarkdown) {
    //     title = `${title.replace(/(\n[\s|\t]*\r*\n)/g, '\n')}\n`
    // }
    if (type === 'OneBot') {
        if (isMarkdown) {
            desp = mdToCqcode(desp).replace(/(\n[\s|\t]*\r*\n)/g, '\n')  // 去除多余换行符
        }
    }
    if (['Telegram', 'Discord'].includes(type) && proxyUrl) { // 设置代理
        (config as any).PROXY_URL = proxyUrl
    }
    return $runPushAllInOne(title, desp, {
        type,
        config,
        option,
    })
}
