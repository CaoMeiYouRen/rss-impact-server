import { Column, Entity, ManyToMany } from 'typeorm'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsObject, Length, ValidateIf, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { HookConfig, HookType } from '@/constant/hook'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'
import { IsSafePositiveInteger } from '@/decorators/is-safe-integer.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
/**
 * 仅保留想要的，必须全部符合
 */
export class Filter {

    @ApiProperty({ title: '条数限制', example: 20 })
    @IsSafePositiveInteger(10000)
    @ValidateIf((o) => typeof o.length !== 'undefined')
    limit?: number

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

    @ApiProperty({ title: '过滤分类', example: 'tag1|tag2' })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.categories !== 'undefined')
    categories?: string

    @ApiProperty({ title: '过滤时间(秒)', example: 3600 })
    @IsSafePositiveInteger()
    @ValidateIf((o) => typeof o.length !== 'undefined')
    time?: number
}
/**
 * 排除不想要的，有一个符合就排除
 */
export class FilterOut {

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

    @ApiProperty({ title: '过滤分类', example: 'tag1|tag2' })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.categories !== 'undefined')
    categories?: string
}

@Entity()
export class Hook extends AclBase {

    @ApiProperty({ title: '名称', example: 'Hook1' })
    @Length(0, 256)
    @Column({
        length: 256,
    })
    name: string

    @ApiProperty({ title: '类型', example: 'webhook', type: () => String })
    @Length(0, 128)
    @Column({
        length: 128,
        type: 'varchar',
    })
    type: HookType

    @ApiProperty({ title: '配置', example: {}, type: () => Object })
    @JsonStringLength(0, 2048)
    @IsObject()
    @Column({
        type: 'simple-json',
        length: 2048,
        default: '{}',
    })
    config: HookConfig

    @ApiProperty({ title: '过滤条件', description: '保留想要的内容', type: () => Filter })
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

    @ApiProperty({ title: '过滤出条件', description: '去掉不要的内容', type: () => FilterOut })
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
