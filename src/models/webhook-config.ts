import { Method, AxiosRequestHeaders } from 'axios'
import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsObject, IsUrl, Length, ValidateIf } from 'class-validator'
import { AjaxConfig } from '@/utils/ajax'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'
import { __DEV__ } from '@/app.config'

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
    @IsUrl({
        require_tld: !__DEV__, // 是否要顶级域名
    })
    @Length(0, 1024)
    url: string

    @SetAclCrudField({
        dicData: methodOptions,
        value: 'GET',
    })
    @ApiProperty({ title: '请求方法', example: {} })
    @IsIn(methodOptions.map((e) => e.value))
    @ValidateIf((o) => typeof o.method !== 'undefined')
    method?: Method

    @ApiProperty({ title: '查询字符串', example: { key: '114514' } })
    @IsObject()
    @JsonStringLength(0, 1024)
    @ValidateIf((o) => typeof o.query !== 'undefined')
    query?: Record<string, unknown>

    @ApiProperty({ title: '请求体', example: {} })
    @IsObject()
    @JsonStringLength(0, 2048)
    @ValidateIf((o) => typeof o.data !== 'undefined')
    data?: Record<string | number | symbol, unknown> | Record<string | number | symbol, unknown>[]

    @ApiProperty({ title: '请求头', example: {} })
    @JsonStringLength(0, 2048)
    @IsObject()
    @ValidateIf((o) => typeof o.headers !== 'undefined')
    headers?: AxiosRequestHeaders

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '超时时间(秒)', description: '默认 60 秒。', example: 60 })
    @IsSafeNaturalNumber(86400)
    @ValidateIf((o) => typeof o.timeout !== 'undefined')
    timeout?: number
}
