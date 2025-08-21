import { AfterLoad, Entity } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import md5 from 'md5'
import { AclBase } from './acl-base.entity'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { StatusList, StatusType } from '@/constant/hook'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { IsUrlOrMagnetUri } from '@/decorators/is-url-or-magnet-uri.decorator'
import { dataFormat } from '@/utils/helper'
import { CustomColumn } from '@/decorators/custom-column.decorator'

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
        type: 'img',
        alone: true,
    })
    @ApiProperty({ title: 'URL', example: 'https://blog.cmyr.ltd/images/favicon-16x16-next.png' })
    @IsUrlOrMagnetUri()
    @CustomColumn({
        type: 'text',
        length: 65535,
    })
    url: string

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '文件名称', example: 'favicon-16x16-next.png' })
    @CustomColumn({
        length: 1024,
        nullable: true,
    })
    name?: string

    @ApiProperty({ title: '文件路径', example: '/data/download/favicon-16x16-next.png' })
    @CustomColumn({
        length: 2048,
        nullable: true,
    })
    path?: string

    @SetAclCrudField({
        search: true,
        type: 'select',
        dicUrl: 'resource/typeDicData',
        minWidth: 180,
    })
    @ApiProperty({ title: '文件类型', example: 'image/png' })
    @CustomColumn({
        length: 128,
        nullable: true,
    })
    type: string

    @SetAclCrudField({
        labelWidth: 105,
        type: 'input',
        hide: true,
    })
    @ApiProperty({ title: '文件体积(B)', description: '单位为 B', example: 114514 })
    @IsSafeNaturalNumber()
    @CustomColumn({
        nullable: true,
    })
    size: number

    @SetAclCrudField({
        labelWidth: 105,
        type: 'input',
    })
    @ApiProperty({ title: '文件体积(B)', description: '单位为 B', example: '114.51 MiB' })
    sizeFormat?: string

    @AfterLoad() // 格式化数据
    private updateSize() {
        if (typeof this.size === 'number') {
            this.sizeFormat = dataFormat(this.size)
        }
    }

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '文件哈希', example: md5('') })
    @CustomColumn({
        index: true,
        length: 128,
    })
    hash: string

    @SetAclCrudField({
        type: 'select',
        dicData: StatusList,
        search: true,
    })
    @ApiProperty({ title: '文件状态', example: 'success' })
    @IsIn(StatusList.map((e) => e.value))
    @CustomColumn({
        length: 16,
    })
    status: StatusType

}

export class FindResource extends FindPlaceholderDto<Resource> {

    @ApiProperty({ type: () => [Resource] })
    declare data: Resource[]

}
