import { AxiosResponse } from 'axios'
import { ServerChanTurbo, CustomEmail, Dingtalk, WechatRobot, WechatApp, PushPlus, IGot, Qmsg, XiZhi, PushDeer, Discord, OneBot, Telegram } from 'push-all-in-one'
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
export async function runPushAllInOne(title: string, desp: string, pushConfig: NotificationConfig, proxyUrl?: string): Promise<AxiosResponse<any, any>> {
    const { isMarkdown, type, config } = pushConfig
    const sep = isMarkdown ? '\n\n' : '\n'
    const content = desp?.startsWith(title) ? desp : `${title}${sep}${desp}`
    switch (type) {
        case 'ServerChanTurbo': {
            const { SCTKEY } = config as NotificationConfig<typeof type>['config']
            const serverChanTurbo = new ServerChanTurbo(SCTKEY)
            return serverChanTurbo.send(title, desp)
        }
        case 'CustomEmail': {
            const customEmail = new CustomEmail(config as NotificationConfig<typeof type>['config'])
            const result = await customEmail.send(title, desp)
            const response = { data: result.response, status: 200, statusText: 'OK', headers: {}, config: {} }
            return response as AxiosResponse<any, any>
        }
        case 'Dingtalk': {
            const { ACCESS_TOKEN, SECRET } = config as NotificationConfig<typeof type>['config']
            const dingtalk = new Dingtalk(ACCESS_TOKEN, SECRET)
            const response = await dingtalk.send(title, desp)
            return response
        }
        case 'WechatRobot': {
            const { WX_ROBOT_KEY, MSG_TYPE } = config as NotificationConfig<typeof type>['config']
            const wechatRobot = new WechatRobot(WX_ROBOT_KEY)
            const response = await wechatRobot.send(`${title}${sep}${desp}`, isMarkdown ? 'markdown' : MSG_TYPE)
            return response
        }
        case 'WechatApp': {
            const { WX_APP_CORPID, WX_APP_AGENTID, WX_APP_SECRET, WX_APP_USERID } = config as NotificationConfig<typeof type>['config']
            const wechatApp = new WechatApp({
                WX_APP_CORPID,
                WX_APP_AGENTID,
                WX_APP_SECRET,
                WX_APP_USERID,
            })
            const response = await wechatApp.send(content, isMarkdown ? 'markdown' : 'text')
            return response
        }
        case 'PushPlus': {
            const { PUSH_PLUS_TOKEN, TEMPLATE_TYPE, CHANNEL_TYPE } = config as NotificationConfig<typeof type>['config']
            const pushplus = new PushPlus(PUSH_PLUS_TOKEN)
            const response = await pushplus.send(title, desp, TEMPLATE_TYPE, CHANNEL_TYPE)
            return response
        }
        case 'IGot': {
            const { I_GOT_KEY } = config as NotificationConfig<typeof type>['config']
            const iGot = new IGot(I_GOT_KEY)
            const response = await iGot.send(title, desp)
            return response
        }
        case 'Qmsg': {
            const { QMSG_KEY, QMSG_QQ, QMSG_PUSH_TYPE } = config as NotificationConfig<typeof type>['config']
            const qmsg = new Qmsg(QMSG_KEY)
            const response = await qmsg.send(content, QMSG_QQ, QMSG_PUSH_TYPE)
            return response
        }
        case 'XiZhi': {
            const { XI_ZHI_KEY } = config as NotificationConfig<typeof type>['config']
            const xiZhi = new XiZhi(XI_ZHI_KEY)
            const response = await xiZhi.send(title, desp)
            return response
        }
        case 'PushDeer': {
            const { PUSH_DEER_PUSH_KEY, PUSH_DEER_ENDPOINT, PUSH_DEER_PUSH_TYPE } = config as NotificationConfig<typeof type>['config']
            const pushDeer = new PushDeer(PUSH_DEER_PUSH_KEY, PUSH_DEER_ENDPOINT)
            const response = await pushDeer.send(title, desp, isMarkdown ? 'markdown' : PUSH_DEER_PUSH_TYPE)
            return response
        }
        case 'Discord': {
            const { DISCORD_WEBHOOK, DISCORD_USERNAME } = config as NotificationConfig<typeof type>['config']
            const discord = new Discord(DISCORD_WEBHOOK, DISCORD_USERNAME)
            if (proxyUrl) {
                discord.proxyUrl = proxyUrl
            }
            const response = await discord.send(content)
            return response
        }
        case 'Telegram': {
            const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = config as NotificationConfig<typeof type>['config']
            const telegram = new Telegram({
                TELEGRAM_BOT_TOKEN,
                TELEGRAM_CHAT_ID: Number(TELEGRAM_CHAT_ID),
            })
            if (proxyUrl) {
                telegram.proxyUrl = proxyUrl
            }
            const response = await telegram.send(content)
            return response
        }
        case 'OneBot': {
            const { ONE_BOT_BASE_URL, ONE_BOT_ACCESS_TOKEN, ONE_BOT_MSG_TYPE, ONE_BOT_RECIEVER_ID } = config as NotificationConfig<typeof type>['config']
            const oneBot = new OneBot(ONE_BOT_BASE_URL, ONE_BOT_ACCESS_TOKEN)
            if (isMarkdown) {
                desp = mdToCqcode(desp)
            }
            const cqContent = desp?.startsWith(title) ? desp : `${title}"\n"${desp}`
            const response = await oneBot.send(cqContent, ONE_BOT_MSG_TYPE, Number(ONE_BOT_RECIEVER_ID))
            return response
        }
        default:
            throw new Error('未匹配到任何推送方式！')

    }
}
