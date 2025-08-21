import { ApiProperty } from '@nestjs/swagger'
import { Length } from 'class-validator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

export class RegularConfig {

    @ApiProperty({ title: '正文正则', description: '匹配正则', example: '' })
    @Length(0, 2048)
    contentRegular: string

    @SetAclCrudField({
        labelWidth: 116,
    })
    @ApiProperty({ title: '正文替换内容', description: '用该内容替换正文的内容', example: '' })
    @Length(0, 2048)
    contentReplace: string

}
