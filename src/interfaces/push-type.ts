import { MsgType, TemplateType, ChannelType, QmsgPushType, PushDeerPushType, CustomEmailType, OneBotMsgType } from 'push-all-in-one'
import { Field } from './avue'
export { MsgType, TemplateType, ChannelType, QmsgPushType, PushDeerPushType, CustomEmailType, OneBotMsgType }

export const CUSTOM_EMAIL_TYPE_MAP = {
    text: '文本',
    html: 'html',
} as const

export const CUSTOM_EMAIL_TYPE_LIST = Object.entries(CUSTOM_EMAIL_TYPE_MAP).map(([value, label]) => ({
    label,
    value,
}))

export type PushConfig = {
    ServerChanTurbo?: {
        SCTKEY: string
    }
    CoolPush?: {
        SKEY: string
        PUSH_TYPE: any
    }
    Dingtalk?: {
        ACCESS_TOKEN: string
        SECRET?: string
    }
    Email?: {
        BER_KEY: string
        EMAIL_ADDRESS: string
    }
    CustomEmail?: {
        EMAIL_TYPE: CustomEmailType // 邮件类型
        EMAIL_TO_ADDRESS: string // 收件人
        EMAIL_AUTH_USER: string // 发件邮箱
        EMAIL_AUTH_PASS: string // 密码/授权码
        EMAIL_HOST: string // 发件域名
        EMAIL_PORT: number // 发件端口
    }
    WechatRobot?: {
        WX_ROBOT_KEY: string
        MSG_TYPE: MsgType
    }
    WechatApp?: {
        WX_APP_CORPID: string
        WX_APP_AGENTID: number
        WX_APP_SECRET: string
        WX_APP_USERID: string
    }
    PushPlus?: {
        PUSH_PLUS_TOKEN: string
        TEMPLATE_TYPE?: TemplateType
        CHANNEL_TYPE?: ChannelType
    }
    IGot?: {
        I_GOT_KEY: string
    }
    Qmsg?: {
        QMSG_KEY: string
        QMSG_QQ: string
        QMSG_PUSH_TYPE: QmsgPushType
    }
    XiZhi?: {
        XI_ZHI_KEY: string
    }
    PushDeer?: {
        PUSH_DEER_PUSH_KEY: string
        PUSH_DEER_ENDPOINT?: string
        PUSH_DEER_PUSH_TYPE?: PushDeerPushType
    }
    UniPush?: {
        PUSH_CLIENTID: string
    }
    Telegram?: {
        TELEGRAM_BOT_TOKEN: string
        TELEGRAM_CHAT_ID: number
        TELEGRAM_SEND_SILENTLY?: boolean
        TELEGRAM_PROTECT_CONTENT?: boolean
        TELEGRAM_MESSAGE_THREAD_ID?: string
    }
    Discord?: {
        DISCORD_WEBHOOK: string
        DISCORD_USERNAME: string
    }
    OneBot?: {
        ONE_BOT_BASE_URL: string
        ONE_BOT_ACCESS_TOKEN?: string
        ONE_BOT_MSG_TYPE: OneBotMsgType
        ONE_BOT_RECIEVER_ID: number
    }
}

export type PushType = keyof PushConfig

export const PushTypeMap: Record<PushType, string> = {
    ServerChanTurbo: 'Server酱·Turbo',
    Dingtalk: '钉钉',
    CustomEmail: '自定义邮件',
    WechatRobot: '企业微信群机器人',
    WechatApp: '企业微信应用推送',
    PushDeer: 'PushDeer',
    PushPlus: 'PushPlus',
    IGot: 'iGot',
    Qmsg: 'Qmsg',
    XiZhi: '息知',
    CoolPush: '酷推',
    Email: 'BER邮件',
    UniPush: 'uni-push2',
    Telegram: 'Telegram',
    Discord: 'Discord',
    OneBot: 'OneBot',
}

export const PushTypeList = Object.entries(PushTypeMap).map(([value, label]) => ({
    label,
    value,
}))

export type PushConfigType = {
    type: PushType
    config: Record<string, unknown>
}

export const DEFAULT_PUSH_CONFIG: Required<PushConfig> = {
    ServerChanTurbo: {
        SCTKEY: '',
    },
    CoolPush: {
        SKEY: '',
        PUSH_TYPE: 'send',
    },
    Dingtalk: {
        ACCESS_TOKEN: '',
        SECRET: '',
    },
    Email: {
        BER_KEY: '',
        EMAIL_ADDRESS: '',
    },
    CustomEmail: {
        EMAIL_TYPE: 'text',
        EMAIL_TO_ADDRESS: '',
        EMAIL_AUTH_USER: '',
        EMAIL_AUTH_PASS: '',
        EMAIL_HOST: '',
        EMAIL_PORT: 0,
    },
    WechatRobot: {
        WX_ROBOT_KEY: '',
        MSG_TYPE: 'text',
    },
    WechatApp: {
        WX_APP_CORPID: '',
        WX_APP_AGENTID: 0,
        WX_APP_SECRET: '',
        WX_APP_USERID: '',
    },
    PushPlus: {
        PUSH_PLUS_TOKEN: '',
        TEMPLATE_TYPE: 'html',
    },
    IGot: {
        I_GOT_KEY: '',
    },
    Qmsg: {
        QMSG_KEY: '',
        QMSG_QQ: '',
        QMSG_PUSH_TYPE: 'send',
    },
    XiZhi: {
        XI_ZHI_KEY: '',
    },
    PushDeer: {
        PUSH_DEER_PUSH_KEY: '',
        PUSH_DEER_ENDPOINT: '',
        PUSH_DEER_PUSH_TYPE: 'markdown',
    },
    UniPush: {
        PUSH_CLIENTID: '',
    },
    Telegram: {
        TELEGRAM_BOT_TOKEN: '',
        TELEGRAM_CHAT_ID: 0,
        TELEGRAM_SEND_SILENTLY: false,
        TELEGRAM_PROTECT_CONTENT: false,
        TELEGRAM_MESSAGE_THREAD_ID: '',
    },
    Discord: {
        DISCORD_WEBHOOK: '',
        DISCORD_USERNAME: '',
    },
    OneBot: {
        ONE_BOT_BASE_URL: '',
        ONE_BOT_ACCESS_TOKEN: '',
        ONE_BOT_MSG_TYPE: 'private',
        ONE_BOT_RECIEVER_ID: 0,
    },
}

export type ParamConfig = Record<PushType, Field[]>

export const DEFAULT_PARAM_CONFIG: ParamConfig = {
    ServerChanTurbo: [],
    CoolPush: [],
    Dingtalk: [],
    Email: [],
    CustomEmail: [],
    WechatRobot: [],
    WechatApp: [],
    PushPlus: [],
    IGot: [],
    Qmsg: [],
    XiZhi: [],
    PushDeer: [],
    UniPush: [],
    Telegram: [],
    Discord: [],
    OneBot: [],
}

export type PushConfigMapType = {
    [T in PushType]: Required<{
        [K in keyof PushConfig[T]]: string
    }>
}

export const PUSH_CONFIG_MAP: PushConfigMapType = {
    ServerChanTurbo: {
        SCTKEY: 'SCTKey',
    },
    CoolPush: {
        SKEY: 'Skey',
        PUSH_TYPE: '推送类型',
    },
    Dingtalk: {
        ACCESS_TOKEN: '访问令牌(access_token)',
        SECRET: '密钥(secret)',
    },
    Email: {
        BER_KEY: 'BER密钥',
        EMAIL_ADDRESS: '邮箱地址',
    },
    CustomEmail: {
        EMAIL_TYPE: '邮件类型',
        EMAIL_TO_ADDRESS: '收件邮箱',
        EMAIL_AUTH_USER: '发件邮箱',
        EMAIL_AUTH_PASS: '发件授权码',
        EMAIL_HOST: '发件域名',
        EMAIL_PORT: '发件端口',
    },
    WechatRobot: {
        WX_ROBOT_KEY: '访问密钥(key)',
        MSG_TYPE: '消息类型',
    },
    WechatApp: {
        WX_APP_CORPID: '企业ID(corpid)',
        WX_APP_AGENTID: '应用ID(agentid)',
        WX_APP_SECRET: '访问密钥(secret)',
        WX_APP_USERID: '成员ID(userid)',
    },
    PushPlus: {
        PUSH_PLUS_TOKEN: '用户令牌(token)',
        TEMPLATE_TYPE: '发送模板',
        CHANNEL_TYPE: '发送渠道',
    },
    IGot: {
        I_GOT_KEY: '推送key',
    },
    Qmsg: {
        QMSG_KEY: '推送key',
        QMSG_QQ: 'QQ号或QQ群',
        QMSG_PUSH_TYPE: '推送类型',
    },
    XiZhi: {
        XI_ZHI_KEY: '推送key',
    },
    PushDeer: {
        PUSH_DEER_PUSH_KEY: '推送key',
        PUSH_DEER_PUSH_TYPE: '推送类型',
        PUSH_DEER_ENDPOINT: '自架服务器地址',
    },
    UniPush: {
        PUSH_CLIENTID: '客户端推送标识',
    },
    Telegram: {
        TELEGRAM_BOT_TOKEN: '机器人令牌',
        TELEGRAM_CHAT_ID: 'Chat ID',
        TELEGRAM_SEND_SILENTLY: '是否静默发送',
        TELEGRAM_PROTECT_CONTENT: '阻止转发/保存',
        TELEGRAM_MESSAGE_THREAD_ID: '话题 ID',
    },
    Discord: {
        DISCORD_WEBHOOK: 'Webhook 地址',
        DISCORD_USERNAME: '机器人名称',
    },
    OneBot: {
        ONE_BOT_BASE_URL: 'HTTP 基础路径',
        ONE_BOT_ACCESS_TOKEN: 'AccessToken',
        ONE_BOT_MSG_TYPE: '消息类型',
        ONE_BOT_RECIEVER_ID: 'QQ 号或群号',
    },
} as const

export const PUSH_TYPE_MAP = {
    send: '私聊推送',
    group: '群消息推送',
    psend: '私有化私聊推送',
    pgroup: '私有化群聊推送',
    wx: '微信消息推送',
    tg: 'Telegram推送',
} as const

export const PUSH_TYPE_LIST = Object.entries(PUSH_TYPE_MAP).map(([value, label]) => ({
    label,
    value,
}))

export const QMSG_PUSH_TYPE_MAP = {
    send: '私聊推送',
    group: '群消息推送',
} as const

export const QMSG_PUSH_TYPE_LIST = Object.entries(QMSG_PUSH_TYPE_MAP).map(([value, label]) => ({
    label,
    value,
}))

export const MSG_TYPE_MAP = {
    text: '文本',
    markdown: 'markdown',
} as const

export const MSG_TYPE_LIST = Object.entries(MSG_TYPE_MAP).map(([value, label]) => ({
    label,
    value,
}))

export const TEMPLATE_TYPE_MAP = {
    html: 'html',
    txt: '文本',
    json: 'json',
    markdown: 'markdown',
    cloudMonitor: '阿里云监控',
    jenkins: 'jenkins插件',
    route: '路由器插件',
} as const

export const TEMPLATE_LIST = Object.entries(TEMPLATE_TYPE_MAP).map(([value, label]) => ({
    label,
    value,
}))

export const CHANNEL_TYPE_MAP = {
    wechat: '微信公众号',
    webhook: '第三方webhook',
    cp: '企业微信应用',
    mail: '邮箱',
    sms: '短信',
} as const

export const CHANNEL_TYPE_LIST = Object.entries(CHANNEL_TYPE_MAP).map(([value, label]) => ({
    label,
    value,
}))

export const PUSH_DEER_PUSH_TYPE_MAP = {
    markdown: 'Markdown',
    text: '文本',
    image: '图片',
} as const

export const PUSH_DEER_PUSH_TYPE_LIST = Object.entries(PUSH_DEER_PUSH_TYPE_MAP).map(([value, label]) => ({
    label,
    value,
}))

export const ONE_BOT_MSG_TYPE_MAP = {
    private: '私聊',
    group: '群聊',
} as const

export const ONE_BOT_MSG_TYPE_LIST = Object.entries(ONE_BOT_MSG_TYPE_MAP).map(([value, label]) => ({
    label,
    value,
}))

export type MetaPushConfig<T extends PushType> = {
    type: T
    config: PushConfig[T]
}

export type ServerChanTurboConfig = MetaPushConfig<'ServerChanTurbo'>

/**
 * @deprecated
 */
export type CoolPushConfig = MetaPushConfig<'CoolPush'>

export type DingtalkConfig = MetaPushConfig<'Dingtalk'>

/**
 * @deprecated
 */
export type EmailConfig = MetaPushConfig<'Email'>

export type CustomEmailConfig = MetaPushConfig<'CustomEmail'>

export type WechatRobotConfig = MetaPushConfig<'WechatRobot'>

export type WechatAppConfig = MetaPushConfig<'WechatApp'>

export type PushPlusConfig = MetaPushConfig<'PushPlus'>

export type IGotConfig = MetaPushConfig<'IGot'>

export type QmsgConfig = MetaPushConfig<'Qmsg'>

export type XiZhiConfig = MetaPushConfig<'XiZhi'>

export type PushDeerConfig = MetaPushConfig<'PushDeer'>

export type TelegramConfig = MetaPushConfig<'Telegram'>

export type OneBotConfig = MetaPushConfig<'OneBot'>

export type PushAllInOneConfig<T extends PushType = PushType> = T extends any ? MetaPushConfig<T> : never
