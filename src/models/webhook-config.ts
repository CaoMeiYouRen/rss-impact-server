import { Method, AxiosRequestHeaders } from 'axios'
import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsObject, IsOptional, Length } from 'class-validator'
import { AjaxConfig } from '@/utils/ajax'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'
import { IsCustomURL } from '@/decorators/is-custom-url.decorator'

const methodOptions: { label: string, value: Method }[] = [
    { label: 'GET', value: 'GET' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'HEAD', value: 'HEAD' },
    { label: 'OPTIONS', value: 'OPTIONS' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'PURGE', value: 'PURGE' },
    { label: 'LINK', value: 'LINK' },
    { label: 'UNLINK', value: 'UNLINK' },
]

export class WebhookConfig implements AjaxConfig {

    @ApiProperty({ title: '请求链接', example: 'http://127.0.0.1:3000' })
    @IsNotEmpty()
    @IsCustomURL()
    @Length(0, 1024)
    url: string

    @SetAclCrudField({
        dicData: methodOptions,
        value: 'GET',
    })
    @ApiProperty({ title: '请求方法', example: {} })
    @IsIn(methodOptions.map((e) => e.value))
    @IsOptional()
    method?: Method

    @ApiProperty({ title: '查询字符串', example: { key: '114514' } })
    @IsObject()
    @JsonStringLength(0, 1024)
    @IsOptional()
    query?: Record<string, unknown>

    @ApiProperty({ title: '请求体', example: {} })
    @IsObject()
    @JsonStringLength(0, 2048)
    @IsOptional()
    data?: Record<string | number | symbol, unknown> | Record<string | number | symbol, unknown>[]

    @ApiProperty({ title: '请求头', example: {} })
    @JsonStringLength(0, 2048)
    @IsObject()
    @IsOptional()
    headers?: AxiosRequestHeaders

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '超时时间(秒)', description: '默认 60 秒。', example: 60 })
    @IsSafeNaturalNumber(86400)
    @IsOptional()
    timeout?: number
}
