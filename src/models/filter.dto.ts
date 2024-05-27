import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, Length } from 'class-validator'
import { IsBetterBytesString } from '@/decorators/is-better-bytes-string'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { ARTICLE_SAVE_DAYS } from '@/app.config'

/**
 * 仅保留想要的，必须全部符合
 */
export class Filter {

    @ApiProperty({ title: '条数限制', description: '限制最大条数，主要用于排行榜类 RSS。默认值 20。', example: 20 })
    @IsSafeNaturalNumber(1000)
    @IsOptional()
    limit?: number

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '过滤时间(秒)', description: '过滤时间，返回指定时间范围内的内容。设置为 0 禁用', example: 3600 })
    @IsSafeNaturalNumber(ARTICLE_SAVE_DAYS * 24 * 60 * 60) // 最大值设置成 文章 最大保存天数
    @IsOptional()
    time?: number

    @ApiProperty({ title: '过滤标题', example: '标题1|标题2' })
    @Length(0, 256)
    @IsOptional()
    title?: string

    @ApiProperty({ title: '过滤总结', example: '总结1|总结2' })
    @Length(0, 1024)
    @IsOptional()
    summary?: string

    @ApiProperty({ title: '过滤作者', example: 'author1|author2' })
    @Length(0, 128)
    @IsOptional()
    author?: string

    @ApiProperty({ title: '过滤分类', description: '分类正则中有一个对得上就保留', example: 'tag1|tag2' })
    @Length(0, 256)
    @IsOptional()
    categories?: string

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '过滤附件URL', example: 'url1|url2' })
    @Length(0, 1024)
    @IsOptional()
    enclosureUrl?: string

    @SetAclCrudField({
        labelWidth: 116,
    })
    @ApiProperty({ title: '过滤附件类型', example: 'type1|type2' })
    @Length(0, 128)
    @IsOptional()
    enclosureType?: string

    @SetAclCrudField({
        labelWidth: 125,
        type: 'input',
        value: '',
    }) // 如果源 RSS 未设置附件体积，则该项不会生效
    @ApiProperty({ title: '过滤附件体积(B)', description: '单位为 B(字节)。支持带单位，例如：1 GiB。设置为空禁用', example: '1 GiB', type: String })
    // @IsSafeNaturalNumber()
    @IsBetterBytesString()
    @IsOptional()
    enclosureLength?: number | string
}
