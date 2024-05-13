import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsNotEmpty, IsObject } from 'class-validator'
import { MetaPushConfig, PushType, PushConfig, PushTypeList } from '@/interfaces/push-type'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

export class NotificationConfig<T extends PushType = PushType> implements MetaPushConfig<PushType> {

    @SetAclCrudField({
        type: 'select',
        dicData: PushTypeList,
    })
    @ApiProperty({ title: '推送类型', description: 'push-all-in-one 支持的推送类型', example: 'ServerChanTurbo' })
    @IsIn(PushTypeList.map((e) => e.value))
    @IsNotEmpty()
    type: T

    @ApiProperty({ title: '推送配置', description: '具体配置请参考 push-all-in-one 文档', example: { SCTKEY: '' } })
    @IsNotEmpty()
    @IsObject()
    config: PushConfig[T]

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

    @ApiProperty({ title: '最大长度', description: '一次推送文本的最大长度。默认值为 4096', example: 4096 })
    @IsSafeNaturalNumber(65535)
    maxLength: number

}
