import { Column, Entity, ManyToMany } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsObject, Length } from 'class-validator'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'
import { HookType } from '@/constant/hook'
import { JsonStringLengthRange } from '@/decorators/json-string-length-range.decorator'

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

    @ApiProperty({ title: '配置', example: {} })
    @JsonStringLengthRange(0, 2048)
    @IsObject()
    @Column({
        type: 'simple-json',
        length: 2048,
    })
    config: any

    @ApiProperty({ title: '过滤条件', example: {} })
    @JsonStringLengthRange(0, 2048)
    @IsObject()
    @Column({
        type: 'simple-json',
        length: 2048,
        nullable: true,
    })
    filter?: any

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
