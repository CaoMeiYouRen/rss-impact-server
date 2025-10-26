import { runPushAllInOne as $runPushAllInOne } from 'push-all-in-one'
import { mdToCqcode } from './helper'
import { ajax } from './ajax'
import { NotificationConfig } from '@/models/notification-config'
import { logger } from '@/middlewares/logger.middleware'

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
    const { isMarkdown, type, config, option, isRemotePush } = pushConfig
    logger.debug('runPushAllInOne: %O', { title, desp, isMarkdown, type, config, option })
    // if (isMarkdown) {
    //     title = `${title.replace(/(\n[\s|\t]*\r*\n)/g, '\n')}\n`
    // }
    if (isMarkdown) {
        if (type === 'OneBot') {
            desp = mdToCqcode(desp).replace(/(\n[\s|\t]*\r*\n)/g, '\n') // 去除多余换行符
        } else if (['Dingtalk', 'WechatRobot', 'WechatApp'].includes(type)) {
            (option as any).msgtype = 'markdown'
        } else if (type === 'PushDeer') {
            (option as any).type = 'markdown'
        } else if (type === 'PushPlus') {
            (option as any).template = 'markdown'
        }
    }
    if (type === 'Dingtalk') {
        // 处理 URL 可能会被风控的问题，例如 kisssub.org
        const linkRegex = /https?:\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi
        const links = desp.match(linkRegex)
        if (links?.length && /kisssub\.org/.test(desp)) {
            links.forEach((link) => {
                desp = desp.replace(link, link.replaceAll('.', '\u200d.\u200d')) // 在点号上添加零宽字符
            })
        }
    }

    if (['Telegram', 'Discord'].includes(type) && proxyUrl) { // 设置代理
        (config as any).PROXY_URL = proxyUrl
    }
    if (isRemotePush) {
        pushConfig.config = config
        pushConfig.option = option
        return runPushAllInCloud(title, desp, pushConfig, proxyUrl)
    }
    return $runPushAllInOne(title, desp, {
        type,
        config,
        option,
    })
}

export async function runPushAllInCloud(title: string, desp: string, pushConfig: NotificationConfig, proxyUrl?: string) {
    const { remotePushUrl, remoteForwardKey, type, config, option } = pushConfig
    const payload = {
        title,
        desp,
        type,
        config,
        option,
    }
    const url = new URL(remotePushUrl)
    url.pathname = '/forward'
    return (await ajax({
        url: url.toString(),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(remoteForwardKey ? { AUTH_FORWARD_KEY: remoteForwardKey } : {}),
        } as any,
        data: payload,
        proxyUrl,
    }))?.data
}
