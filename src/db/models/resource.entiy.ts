import { Column, Entity, Index } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsUrl, Length, ValidateIf } from 'class-validator'
import md5 from 'md5'
import { AclBase } from './acl-base.entity'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { StatusList, StatusType } from '@/constant/hook'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

/**
 * 文件资源。
 *
 * @author CaoMeiYouRen
 * @date 2024-03-25
 * @export
 * @class Resource
 */
@Entity()
export class Resource extends AclBase {

    @SetAclCrudField({
        search: true,
        span: 24,
    })
    @ApiProperty({ title: 'URL', example: 'https://blog.cmyr.ltd/images/favicon-16x16-next.png' })
    @IsNotEmpty()
    @IsUrl({})
    @Length(0, 2048)
    @Index({})
    @Column({
        length: 2048,
    })
    url: string

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '文件名称', example: 'favicon-16x16-next.png' })
    @IsNotEmpty()
    @Length(0, 1024)
    @Column({
        length: 1024,
        nullable: true,
    })
    name: string

    @ApiProperty({ title: '文件路径', example: '/data/download/favicon-16x16-next.png' })
    @Length(0, 2048)
    @ValidateIf((o) => typeof o.path !== 'undefined')
    @Column({
        length: 2048,
    })
    path?: string

    @SetAclCrudField({
        search: true,
        type: 'select',
        dicUrl: 'resource/typeDicData',
    })
    @ApiProperty({ title: '文件类型', example: 'image/png' })
    @IsNotEmpty()
    @Length(0, 128)
    @Column({
        length: 128,
    })
    type: string

    @SetAclCrudField({
        width: 100,
        labelWidth: 105,
        type: 'input',
    })
    @ApiProperty({ title: '文件大小(B)', description: '单位为 B', example: 114514 })
    @IsSafeNaturalNumber()
    @Column({})
    size: number

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '文件哈希', example: md5('') })
    @IsNotEmpty()
    @Length(0, 128)
    @Index({})
    @Column({
        length: 128,
    })
    hash: string

    @SetAclCrudField({
        type: 'select',
        dicData: StatusList,
        search: true,
    })
    @ApiProperty({ title: '文件状态', example: 'success' })
    @IsNotEmpty()
    @Length(0, 16)
    @Column({
        length: 16,
    })
    status: StatusType

}

export class FindResource extends FindPlaceholderDto<Resource> {
    @ApiProperty({ type: () => [Resource] })
    declare data: Resource[]
}
