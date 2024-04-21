import { AfterLoad, Column, Entity } from 'typeorm'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { Length, IsNotEmpty, IsObject, ValidateNested, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Filter, FilterOut } from './hook.entity'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { OutputType, OutputTypeList } from '@/constant/custom-query'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'

/**
 * 自定义 RSS 查询
 *
 * @author CaoMeiYouRen
 * @date 2024-04-21
 * @export
 * @class CustomQuery
 */
@Entity()
export class CustomQuery extends AclBase {
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '名称', example: '查询A' })
    @Length(0, 256)
    @IsNotEmpty()
    @Column({
        length: 256,
    })
    name: string

    @SetAclCrudField({
        search: true,
        type: 'select',
        dicData: OutputTypeList,
        value: 'rss2.0',
    })
    @ApiProperty({ title: '输出格式', example: 'rss2.0' })
    @IsIn(OutputTypeList.map((e) => e.value))
    @Length(0, 32)
    @IsNotEmpty()
    @Column({
        length: 32,
        default: 'rss2.0',
    })
    format: OutputType

    @SetAclCrudField({
        addDisplay: false,
        editDisabled: true,
    })
    @ApiProperty({ title: '输出路径' })
    url?: string

    @AfterLoad() // 生成输出 url
    private updateUrl() {
        if (this.format) {
            // this.outputUrl = ''
        }
    }

    @SetAclCrudField({
    })
    @ApiProperty({ title: '过滤条件', description: '保留想要的内容，必须符合全部条件才保留。支持通过正则表达式过滤。留空的规则不会过滤。', type: Filter })
    @Type(() => Filter)
    @ValidateNested()
    @JsonStringLength(0, 2048)
    @IsObject()
    @IsNotEmpty()
    @Column({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    filter: Filter

    @SetAclCrudField({
    })
    @ApiProperty({ title: '排除条件', description: '去掉不要的内容，有一个条件符合就排除。支持通过正则表达式排除。留空的规则不会排除。', type: FilterOut })
    @Type(() => FilterOut)
    @ValidateNested()
    @JsonStringLength(0, 2048)
    @IsObject()
    @IsNotEmpty()
    @Column({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    filterout: FilterOut
}

export class CreateCustomQuery extends OmitType(CustomQuery, ['id', 'createdAt', 'updatedAt'] as const) { }

export class UpdateCustomQuery extends PartialType(OmitType(CustomQuery, ['createdAt', 'updatedAt'] as const)) { }

export class FindCustomQuery extends FindPlaceholderDto<CustomQuery> {
    @ApiProperty({ type: () => [CustomQuery] })
    declare data: CustomQuery[]
}
