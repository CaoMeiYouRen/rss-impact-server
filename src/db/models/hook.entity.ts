import { Column, Entity, ManyToMany } from 'typeorm'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsObject, Length, ValidateIf, ValidateNested, IsIn, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { HookConfig, HookList, HookType } from '@/constant/hook'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'
import { IsSafePositiveInteger } from '@/decorators/is-safe-integer.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
/**
 * 仅保留想要的，必须全部符合
 */
export class Filter {

    @ApiProperty({ title: '条数限制', description: '限制最大条数，主要用于排行榜类 RSS。默认值 20。', example: 20 })
    @IsSafePositiveInteger(10000)
    @ValidateIf((o) => typeof o.length !== 'undefined')
    limit?: number

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '过滤时间(秒)', description: '过滤时间，返回指定时间范围内的内容。设置为 0 禁用', example: 3600 })
    @IsSafePositiveInteger()
    @ValidateIf((o) => typeof o.length !== 'undefined')
    time?: number

    @ApiProperty({ title: '过滤标题', example: '标题1|标题2' })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.title !== 'undefined')
    title?: string

    @ApiProperty({ title: '过滤总结', example: '总结1|总结2' })
    @Length(0, 1024)
    @ValidateIf((o) => typeof o.title !== 'undefined')
    summary?: string

    @ApiProperty({ title: '过滤作者', example: 'CaoMeiYouRen' })
    @Length(0, 128)
    @ValidateIf((o) => typeof o.author !== 'undefined')
    author?: string

    @ApiProperty({ title: '过滤分类', description: '分类正则中有一个对得上就保留', example: 'tag1|tag2' })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.categories !== 'undefined')
    categories?: string
}
/**
 * 排除不想要的，有一个符合就排除
 */
export class FilterOut {

    @ApiProperty({ title: '排除标题', example: '标题1|标题2' })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.title !== 'undefined')
    title?: string

    @ApiProperty({ title: '排除总结', example: '总结1|总结2' })
    @Length(0, 1024)
    @ValidateIf((o) => typeof o.title !== 'undefined')
    summary?: string

    @ApiProperty({ title: '排除作者', example: 'CaoMeiYouRen' })
    @Length(0, 128)
    @ValidateIf((o) => typeof o.author !== 'undefined')
    author?: string

    @ApiProperty({ title: '排除分类', description: '分类正则中有一个对得上就排除', example: 'tag1|tag2' })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.categories !== 'undefined')
    categories?: string
}

@Entity()
export class Hook extends AclBase {

    @ApiProperty({ title: '名称', example: 'Hook1' })
    @Length(0, 256)
    @IsNotEmpty()
    @Column({
        length: 256,
    })
    name: string

    @SetAclCrudField({
        type: 'select',
        search: true,
        dicData: HookList,
    })
    @ApiProperty({ title: '类型', example: 'webhook', type: () => String })
    @IsNotEmpty()
    @IsIn(HookList.map((e) => e.value))
    @Column({
        length: 128,
        type: 'varchar',
    })
    type: HookType

    @SetAclCrudField({
        type: 'textarea',
        span: 24,
        params: {
            option: {
                submitBtn: false,
                emptyBtn: false,
                column: [],
            },
        },
    })
    @ApiProperty({ title: '配置', example: {}, type: () => Object })
    @JsonStringLength(0, 2048)
    @IsObject()
    @Column({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    config: HookConfig

    @SetAclCrudField({
        type: 'textarea',
    })
    @ApiProperty({ title: '过滤条件', description: '保留想要的内容，必须符合全部条件才保留。支持通过正则表达式过滤。留空的规则不会过滤。', type: Filter })
    @Type(() => Filter)
    @ValidateNested()
    @JsonStringLength(0, 2048)
    @IsObject()
    // @ValidateIf((o) => typeof o.filter !== 'undefined')
    @Column({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    filter: Filter

    @SetAclCrudField({
        type: 'textarea',
    })
    @ApiProperty({ title: '排除条件', description: '去掉不要的内容，有一个条件符合就排除。支持通过正则表达式排除。留空的规则不会排除。', type: FilterOut })
    @Type(() => FilterOut)
    @ValidateNested()
    @JsonStringLength(0, 2048)
    @IsObject()
    // @ValidateIf((o) => typeof o.filter !== 'undefined')
    @Column({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    filterout: FilterOut

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '反转模式', description: '如果服务可访问，则认为是故障', example: false })
    @IsBoolean()
    @Column({
        default: false,
    })
    isReversed: boolean

    @SetAclCrudField({
        hide: true,
    })
    @ApiProperty({ title: '订阅源列表', example: [], type: () => [Feed] })
    @ManyToMany(() => Feed, (feed) => feed.hooks)
    feeds: Feed[]

}

export class CreateHook extends OmitType(Hook, ['id', 'createdAt', 'updatedAt'] as const) { }

export class UpdateHook extends PartialType(OmitType(Hook, ['createdAt', 'updatedAt'] as const)) { }

export class FindHook extends FindPlaceholderDto<Hook> {
    @ApiProperty({ type: () => [Hook] })
    declare data: Hook[]
}
