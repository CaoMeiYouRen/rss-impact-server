import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsNotEmpty, IsObject, IsOptional, Length, ValidateIf } from 'class-validator'
import { MetaPushConfig, PushType, PushTypeList } from '@/interfaces/push-type'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { IsCustomURL } from '@/decorators/is-custom-url.decorator'

export class NotificationConfig<T extends PushType = PushType> implements MetaPushConfig<PushType> {

    @SetAclCrudField({
        type: 'select',
        dicData: PushTypeList,
    })
    @ApiProperty({ title: '推送类型', description: 'push-all-in-one 支持的推送类型', example: 'ServerChanTurbo' })
    @IsIn(PushTypeList.map((e) => e.value))
    @IsNotEmpty()
    type: T

    @ApiProperty({ title: '推送配置', description: '具体配置请参考 push-all-in-one 文档，在线生成配置：https://push.cmyr.dev', example: { SERVER_CHAN_TURBO_SENDKEY: '' } })
    @IsNotEmpty()
    @IsObject()
    config: MetaPushConfig<T>['config']

    @ApiProperty({
        title: '附加参数',
        description: '具体附加参数请参考 push-all-in-one 文档，在线生成配置：https://push.cmyr.dev',
        example: {
            short: '1',
            noip: true,
            channel: '1',
            openid: '1',
        },
    })
    @IsOptional()
    @IsObject()
    option: MetaPushConfig<T>['option']

    @ApiProperty({ title: '合并推送', description: '在一次轮询中检测到多条 RSS 更新，将合并为一条推送', example: true })
    @IsBoolean({})
    isMergePush: boolean

    @ApiProperty({ title: 'Markdown', description: '对于支持 markdown 格式的渠道，将使用 markdown 格式推送', example: true })
    @IsBoolean({})
    isMarkdown: boolean

    @ApiProperty({ title: '纯文本', description: '去除 HTML，仅保留纯文本部分', example: false })
    @IsBoolean({})
    isSnippet: boolean

    @ApiProperty({ title: '仅总结', description: '如果有总结的话，只推送总结部分；否则从 摘要 中截取前 512 个字符', example: false })
    @IsBoolean({})
    onlySummary: boolean

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '使用 AI 总结', description: '如果是，则用 AI 总结替换原本的总结' })
    @IsBoolean()
    useAiSummary: boolean

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '增加 AI 总结', description: '如果是，则将 AI 总结 增加 到正文前，以方便通过 RSS 阅读器阅读' })
    @IsBoolean()
    appendAiSummary: boolean

    @ApiProperty({ title: '最大长度', description: '一次推送文本的最大长度。默认值为 4096', example: 4096 })
    @IsSafeNaturalNumber(65535)
    maxLength: number

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '是否远程推送', description: '如果为否，则通过在本地调用 push-all-in-one 进行推送，可用性取决于本机网络；如果为是，则通过调用远程的 push-all-in-cloud 进行推送，适合服务器无法访问外网的情况', example: false })
    @IsBoolean({})
    isRemotePush: boolean

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '远程推送地址', description: '远程推送请设置本字段为 push-all-in-cloud 服务的地址。参考：https://github.com/CaoMeiYouRen/push-all-in-cloud', example: '' })
    @IsOptional()
    @IsCustomURL()
    @Length(0, 1024)
    @ValidateIf((o) => o.isRemotePush === true)
    remotePushUrl?: string


    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '远程推送KEY', description: '请替换为真实的 AUTH_FORWARD_KEY', example: '' })
    @IsOptional()
    @Length(0, 1024)
    @ValidateIf((o) => o.isRemotePush === true)
    remoteForwardKey?: string

}
