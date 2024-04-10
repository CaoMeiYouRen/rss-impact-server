import { PushAllInOneConfig } from '@/interfaces/push-type'

export class NotificationConfig {
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
