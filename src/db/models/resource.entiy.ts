import { Column, Entity, Index } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsUrl, Length } from 'class-validator'
import md5 from 'md5'
import { Base } from './base.entity'
import { IsSafePositiveInteger } from '@/decorators/is-safe-integer.decorator'

// TODO 考虑区分相同文件在不同用户的权限
/**
 * 文件资源
 *
 * @author CaoMeiYouRen
 * @date 2024-03-25
 * @export
 * @class Resource
 */
@Entity()
export class Resource extends Base {

    @ApiProperty({ title: 'URL', example: 'https://blog.cmyr.ltd/images/favicon-16x16-next.png' })
    @IsNotEmpty()
    @IsUrl({})
    @Length(0, 2048)
    @Index({})
    @Column({
        length: 2048,
    })
    url: string

    @ApiProperty({ title: '文件路径', example: '/data/download/favicon-16x16-next.png' })
    @IsNotEmpty()
    @Length(0, 2048)
    @Column({
        length: 2048,
    })
    path: string

    @ApiProperty({ title: '文件类型', example: 'image/png' })
    @IsNotEmpty()
    @Length(0, 128)
    @Column({
        length: 128,
    })
    type: string

    @ApiProperty({ title: '文件大小(B)', description: '单位为 B', example: 114514 })
    @IsSafePositiveInteger()
    @Column({})
    size: number

    @ApiProperty({ title: '文件哈希', example: md5('') })
    @IsNotEmpty()
    @Length(0, 128)
    @Index({})
    @Column({
        length: 128,
    })
    hash: string

    @ApiProperty({ title: '文件状态', example: 'success' })
    @IsNotEmpty()
    @Length(0, 16)
    @Column({
        length: 16,
    })
    status: 'success' | 'fail' | 'ban' | 'unknown'
}
