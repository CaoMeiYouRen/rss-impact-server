import { ApiProperty } from '@nestjs/swagger'
import { Length, IsOptional } from 'class-validator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

/**
 * 排除不想要的，有一个符合就排除
 */
export class FilterOut {

    @ApiProperty({ title: '排除链接', example: 'url1|url2' })
    @Length(0, 2048)
    @IsOptional()
    link?: string

    @ApiProperty({ title: '排除标题', example: '标题1|标题2' })
    @Length(0, 256)
    @IsOptional()
    title?: string

    @ApiProperty({ title: '排除正文', example: '正文1|正文2' })
    @Length(0, 2048)
    @IsOptional()
    content?: string

    @ApiProperty({ title: '排除总结', example: '总结1|总结2' })
    @Length(0, 1024)
    @IsOptional()
    summary?: string

    @ApiProperty({ title: '排除作者', example: 'author1|author2' })
    @Length(0, 256)
    @IsOptional()
    author?: string

    @ApiProperty({ title: '排除分类', description: '分类正则中有一个对得上就排除', example: 'tag1|tag2' })
    @Length(0, 256)
    @IsOptional()
    categories?: string

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '排除附件URL', example: 'url1|url2' })
    @Length(0, 2048)
    @IsOptional()
    enclosureUrl?: string

    @SetAclCrudField({
        labelWidth: 116,
    })
    @ApiProperty({ title: '排除附件类型', example: 'type1|type2' })
    @Length(0, 256)
    @IsOptional()
    enclosureType?: string

}
