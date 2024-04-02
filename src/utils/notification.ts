import { AxiosResponse } from 'axios'
import { ServerChanTurbo, CustomEmail, Dingtalk, WechatRobot, WechatApp, PushPlus, IGot, Qmsg, XiZhi, PushDeer, Discord, OneBot, Telegram } from 'push-all-in-one'
import { PushAllInOneConfig, PushType } from '@/interfaces/push-type'

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
export async function runPushAllInOne(title: string, desp: string, pushConfig: PushAllInOneConfig<PushType>): Promise<AxiosResponse<any, any>> {
    switch (pushConfig.type) {
        case 'ServerChanTurbo': {
            const { SCTKEY } = pushConfig.config
            const serverChanTurbo = new ServerChanTurbo(SCTKEY)
            return serverChanTurbo.send(title, desp)
        }
        case 'CustomEmail': {
            const customEmail = new CustomEmail(pushConfig.config)
            const result = await customEmail.send(title, desp)
            const response = { data: result.response, status: 200, statusText: 'OK', headers: {}, config: {} }
            return response as AxiosResponse<any, any>
        }
        case 'Dingtalk': {
            const { ACCESS_TOKEN, SECRET } = pushConfig.config
            const dingtalk = new Dingtalk(ACCESS_TOKEN, SECRET)
            const response = await dingtalk.send(title, desp)
            return response
        }
        case 'WechatRobot': {
            const { WX_ROBOT_KEY, MSG_TYPE } = pushConfig.config
            const wechatRobot = new WechatRobot(WX_ROBOT_KEY)
            const response = await wechatRobot.send(`${title}\n${desp}`, MSG_TYPE)
            return response
        }
        case 'WechatApp': {
            const { WX_APP_CORPID, WX_APP_AGENTID, WX_APP_SECRET, WX_APP_USERID } = pushConfig.config
            const wechatApp = new WechatApp({
                WX_APP_CORPID,
                WX_APP_AGENTID,
                WX_APP_SECRET,
                WX_APP_USERID,
            })
            const response = await wechatApp.send(`${title}\n${desp}`)
            return response
        }
        case 'PushPlus': {
            const { PUSH_PLUS_TOKEN, TEMPLATE_TYPE, CHANNEL_TYPE } = pushConfig.config
            const pushplus = new PushPlus(PUSH_PLUS_TOKEN)
            const response = await pushplus.send(title, desp, TEMPLATE_TYPE, CHANNEL_TYPE)
            return response
        }
        case 'IGot': {
            const { I_GOT_KEY } = pushConfig.config
            const iGot = new IGot(I_GOT_KEY)
            const response = await iGot.send(title, desp)
            return response
        }
        case 'Qmsg': {
            const { QMSG_KEY, QMSG_QQ, QMSG_PUSH_TYPE } = pushConfig.config
            const qmsg = new Qmsg(QMSG_KEY)
            const response = await qmsg.send(`${title}\n${desp}`, QMSG_QQ, QMSG_PUSH_TYPE)
            return response
        }
        case 'XiZhi': {
            const { XI_ZHI_KEY } = pushConfig.config
            const xiZhi = new XiZhi(XI_ZHI_KEY)
            const response = await xiZhi.send(title, desp)
            return response
        }
        case 'PushDeer': {
            const { PUSH_DEER_PUSH_KEY, PUSH_DEER_ENDPOINT, PUSH_DEER_PUSH_TYPE } = pushConfig.config
            const pushDeer = new PushDeer(PUSH_DEER_PUSH_KEY, PUSH_DEER_ENDPOINT)
            const response = await pushDeer.send(title, desp, PUSH_DEER_PUSH_TYPE)
            return response
        }
        case 'Discord': {
            const { DISCORD_WEBHOOK, DISCORD_USERNAME } = pushConfig.config
            const discord = new Discord(DISCORD_WEBHOOK, DISCORD_USERNAME)
            const response = await discord.send(`${title}\n${desp}`)
            return response
        }
        case 'Telegram': {
            const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = pushConfig.config
            const telegram = new Telegram({
                TELEGRAM_BOT_TOKEN,
                TELEGRAM_CHAT_ID: Number(TELEGRAM_CHAT_ID),
            })
            const response = await telegram.send(`${title}\n${desp}`)
            return response
        }
        case 'OneBot': {
            const { ONE_BOT_BASE_URL, ONE_BOT_ACCESS_TOKEN, ONE_BOT_MSG_TYPE, ONE_BOT_RECIEVER_ID } = pushConfig.config
            const oneBot = new OneBot(ONE_BOT_BASE_URL, ONE_BOT_ACCESS_TOKEN)
            const response = await oneBot.send(`${title}\n${desp}`, ONE_BOT_MSG_TYPE, Number(ONE_BOT_RECIEVER_ID))
            return response
        }
        default:
            throw new Error('未匹配到任何推送方式！')

    }
}
