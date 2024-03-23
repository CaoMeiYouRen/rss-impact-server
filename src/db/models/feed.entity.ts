import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsNotEmpty, IsUrl, Length, ValidateIf } from 'class-validator'
import { Expose } from 'class-transformer'
import { AclBase } from './acl-base.entity'
import { Category } from './category.entity'
import { Article } from './article.entity'
import { Hook } from './hook.entity'
import { IsId } from '@/decorators/is-id.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { RssLabelList } from '@/constant/rss-cron'

/**
 * RSS 订阅表
 *
 * @author CaoMeiYouRen
 * @date 2024-03-19
 * @export
 * @class Feed
 */
@Entity()
export class Feed extends AclBase {

    @ApiProperty({ title: 'URL', example: 'https://blog.cmyr.ltd/atom.xml' })
    @IsNotEmpty({ message: '$property 不能为空' })
    @IsUrl({}, { message: '$property 必须为标准URL格式' })
    @Length(0, 2048, { message: '$property 的长度必须在 $constraint1 到 $constraint2 个字符！' })
    @Index({
        // unique: true,
    })
    @Column({
        length: 2048,
        // unique: true,
    })
    url: string

    @ApiProperty({ title: '标题', example: '这是一个标题' })
    @IsNotEmpty({ message: '标题不能为空' })
    @Length(0, 256, { message: '标题最大不能超过 $constraint2 个字符' })
    @Column({
        length: 256,
    })
    title: string

    @ApiProperty({ title: '简介', example: '这是一段简介' })
    @IsNotEmpty({ message: '简介不能为空' })
    @Length(0, 4096, { message: '简介最大不能超过 $constraint2 个字符' })
    @Column({
        length: 4096,
    })
    description: string

    @ApiProperty({ title: '封面 URL', example: 'https://blog.cmyr.ltd/images/logo.svg' })
    @IsUrl({}, { message: '封面Url必须为标准URL格式' })
    @Length(0, 2048, { message: '封面Url最大不能超过 $constraint2 个字符！' })
    @ValidateIf((o) => ['string'].includes(typeof o.imageUrl))
    @Column({
        length: 2048,
        nullable: true,
    })
    imageUrl?: string

    @SetAclCrudField({
        dicData: RssLabelList,
    })
    @ApiProperty({ title: 'Cron', example: 'EVERY_10_MINUTES' })
    @Length(0, 256, { message: 'Cron最大不能超过256个字符' })
    @Column({
        length: 256,
        default: 'EVERY_10_MINUTES',
    })
    cron: string

    // @ApiProperty({ title: '是否活跃', example: true })
    // @IsBoolean({ message: '是否活跃必须为 Boolean' })
    // @Column({
    //     default: true,
    // })
    // isActive: boolean

    @ApiProperty({ title: '是否启用', example: true })
    @IsBoolean({ message: '是否启用必须为 Boolean' })
    @Column({
        default: true,
    })
    isEnabled: boolean

    @ApiProperty({ title: '分组ID', example: 1 })
    @IsId()
    @Column({ nullable: true })
    categoryId: number

    @ApiProperty({ title: '分组', type: () => Category })
    @ManyToOne(() => Category, (category) => category.feeds)
    category: Category

    @ApiProperty({ title: '文章列表', example: [], type: () => [Article] })
    @OneToMany(() => Article, (article) => article.feed)
    articles: Article[]

    @ApiProperty({ title: 'HookID 列表', example: [1] })
    @IsId({ each: true })
    @IsArray()
    hookIds: number[]

    @ApiProperty({ title: 'Hook列表', example: [], type: () => [Hook] })
    @ManyToMany(() => Hook, (hook) => hook.feeds)
    @JoinTable()
    hooks: Hook[]
}

export class CreateFeed extends OmitType(Feed, ['id', 'createdAt', 'updatedAt'] as const) { }

export class UpdateFeed extends PartialType(OmitType(Feed, ['createdAt', 'updatedAt'] as const)) { }
