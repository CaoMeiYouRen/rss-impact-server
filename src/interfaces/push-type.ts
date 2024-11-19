import { PushType, MetaPushConfig } from 'push-all-in-one'

export const PushTypeMap: Record<PushType, string> = {
    ServerChanTurbo: 'Server酱·Turbo',
    ServerChanV3: 'Server 酱³',
    Dingtalk: '钉钉',
    CustomEmail: '自定义邮件',
    WechatRobot: '企业微信群机器人',
    WechatApp: '企业微信应用推送',
    PushDeer: 'PushDeer',
    PushPlus: 'PushPlus',
    IGot: 'iGot',
    Qmsg: 'Qmsg',
    XiZhi: '息知',
    Telegram: 'Telegram',
    Discord: 'Discord',
    OneBot: 'OneBot',

}

export const PushTypeList = Object.entries(PushTypeMap).map(([value, label]) => ({
    label,
    value,
}))

export { MetaPushConfig, PushType }

