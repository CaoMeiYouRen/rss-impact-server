import { Column, Entity, ManyToMany } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsObject, Length, Max, Min, ValidateIf, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { HookConfig, HookType } from '@/constant/hook'
import { JsonStringLength } from '@/decorators/json-string-length.decorator'

export class Filter {

    @ApiProperty({ title: '条数限制', example: 20 })
    @IsNumber()
    @Min(0)
    @Max(Number.MAX_SAFE_INTEGER)
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
    // @JsonStringLength(0, 512)
    // @IsArray()
    // @IsString({ each: true })
    @Length(0, 256)
    @ValidateIf((o) => typeof o.categories !== 'undefined')
    categories?: string

    @ApiProperty({ title: '过滤时间(秒)', example: 3600 })
    @IsNumber()
    @Min(0)
    @Max(Number.MAX_SAFE_INTEGER)
    @ValidateIf((o) => typeof o.length !== 'undefined')
    time?: number
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

    @ApiProperty({ title: '过滤条件', type: () => Filter })
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

    @ApiProperty({ title: '反转模式', description: '如果服务可访问，则认为是故障', example: false })
    @IsBoolean()
    @Column({
        default: false,
    })
    isReversed: boolean

    @ApiProperty({ title: '订阅源列表', example: [], type: () => [Feed] })
    @ManyToMany(() => Feed, (feed) => feed.hooks)
    feeds: Feed[]
}
