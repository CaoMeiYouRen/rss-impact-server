import { Column, Entity, Index, OneToMany } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, Length, ValidateIf } from 'class-validator'
import { AclBase } from './acl-base.entity'
import { Feed } from './feed.entity'

/**
 * 分组表
 *
 * @author CaoMeiYouRen
 * @date 2024-03-20
 * @export
 * @class Category
 */
@Entity()
export class Category extends AclBase {

    @ApiProperty({ title: '分组名称', example: '分组A' })
    @IsNotEmpty({ message: '名称不能为空' })
    @Length(0, 256, { message: '名称的长度必须在 $constraint1 到 $constraint2 个字符！' })
    @Index({})
    @Column({
        length: 256,
    })
    name: string

    @ApiProperty({ title: '分组简介', example: '分组A' })
    @Length(0, 2048, { message: '简介的长度必须在 $constraint1 到 $constraint2 个字符！' })
    @ValidateIf((o) => ['string'].includes(typeof o.description))
    @Column({
        nullable: true,
        length: 4096,
    })
    description?: string

    @ApiProperty({ title: '订阅链接', example: [], type: () => [Feed] })
    @OneToMany(() => Feed, (feed) => feed.category)
    feeds: Feed[]

}
