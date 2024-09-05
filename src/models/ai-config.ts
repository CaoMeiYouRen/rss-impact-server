import { ApiProperty } from '@nestjs/swagger'
import { Length, IsIn, IsNotEmpty, IsBoolean, Max, Min, IsOptional } from 'class-validator'
import { AIActionList, AIActionType, AIList, AIType, ContentList, ContentType } from '@/constant/hook'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { IsCustomURL } from '@/decorators/is-custom-url.decorator'

export class AIConfig {

    @SetAclCrudField({
        type: 'select',
        dicData: AIList,
        search: true,
        value: 'openAI',
    })
    @ApiProperty({ title: '类型', description: 'AI 大模型。目前仅支持 OpenAI', example: 'openAI' })
    @IsIn(AIList.map((e) => e.value))
    @IsNotEmpty()
    type: AIType

    @SetAclCrudField({
        type: 'select',
        dicData: AIActionList,
        search: true,
        value: 'summary',
    })
    @ApiProperty({ title: '操作', description: '要 AI 大模型进行的操作。默认为 总结正文。', example: 'summary' })
    @IsIn(AIActionList.map((e) => e.value))
    action: AIActionType

    @ApiProperty({ title: 'API Key', description: 'OpenAI API Key' })
    @Length(0, 128)
    @IsNotEmpty()
    apiKey: string

    @ApiProperty({ title: '模型名称', description: 'OpenAI 模型名称。默认 gpt-3.5-turbo', example: 'gpt-3.5-turbo' })
    @Length(0, 128)
    @IsOptional()
    model?: string

    @ApiProperty({ title: 'API 地址', description: 'OpenAI API 地址。注意需要带有版本号。默认 https://api.openai.com/v1', example: 'https://api.openai.com/v1' })
    @Length(0, 2048)
    @IsCustomURL()
    @IsOptional()
    endpoint?: string

    @SetAclCrudField({
        type: 'textarea',
    })
    @ApiProperty({ title: '提示语', description: 'OpenAI 提示语。通过修改提示语也可以实现翻译等功能' })
    @Length(0, 2048)
    @IsOptional()
    prompt?: string

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '超时时间(秒)', description: '默认值 120 秒', example: 120 })
    @IsSafeNaturalNumber()
    @IsOptional()
    timeout?: number

    @SetAclCrudField({
        step: 0.1,
        value: 0,
    })
    @ApiProperty({ title: '温度参数', description: 'OpenAI 温度参数，越高越随机，反之越稳定。默认值 0', example: 0.1 })
    @Max(1)
    @Min(0)
    @IsOptional()
    temperature?: number

    @SetAclCrudField({
        labelWidth: 116,
    })
    @ApiProperty({ title: '最大上下文长度', description: 'OpenAI 最大上下文长度。即一次提交多少 token 的字符。注意：提示文本加上"最大 token 数"的 token 数量不能超过模型的上下文长度。默认值 4096', example: 4096 })
    @IsSafeNaturalNumber()
    @IsOptional()
    maxContextLength?: number

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '最大 token 数', description: 'OpenAI 最大 token 数。注意一定要比模型的 最大上下文 小，否则可能会总结失败。默认值 2048', example: 2048 })
    @IsSafeNaturalNumber()
    @IsOptional()
    maxTokens?: number

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '最小正文长度', description: '当 RSS 的正文超过这个数字时，才启用 AI 总结。默认值 1024。设置为 0 则不限制。', example: 1024 })
    @IsSafeNaturalNumber()
    @IsOptional()
    minContentLength?: number

    @SetAclCrudField({
        value: false,
    })
    @ApiProperty({ title: '总结为空', description: '仅在总结为空时启用 AI 大模型' })
    @IsBoolean()
    isOnlySummaryEmpty: boolean

    @SetAclCrudField({
        value: true,
    })
    @ApiProperty({ title: '分段提交', description: '如果正文的长度超过 最大 token 数，是否分段提交给 AI 大模型。如果为否，则只提交不超过 最大 token 数 的内容' })
    @IsBoolean()
    isSplit: boolean

    @SetAclCrudField({
        value: true,
    })
    @ApiProperty({ title: '包含标题', description: '提交给 ChatGPT 的内容是否包含标题。如果启用，标题长度也将计算在正文长度中' })
    @IsBoolean()
    isIncludeTitle: boolean

    @SetAclCrudField({
        type: 'select',
        dicData: ContentList,
        search: true,
        value: 'text',
    })
    @ApiProperty({ title: '输出格式', description: '如果为 纯文本，则使用 摘要 输出 纯文本总结；如果为 HTML，则使用正文输出 HTML 总结。正文长度也将分别计算。', example: 'text' })
    @IsIn(ContentList.map((e) => e.value))
    @IsNotEmpty()
    contentType: ContentType

}

