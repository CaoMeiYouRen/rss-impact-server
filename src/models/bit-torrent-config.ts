import { ApiProperty } from '@nestjs/swagger'
import { Length, IsIn, IsNotEmpty, IsUrl, IsOptional } from 'class-validator'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { BitTorrentList, BitTorrentType } from '@/constant/hook'
import { __PROD__ } from '@/app.config'

export class BitTorrentConfig {

    @SetAclCrudField({
        type: 'select',
        dicData: BitTorrentList,
        search: true,
        value: 'qBittorrent',
    })
    @ApiProperty({ title: '类型', description: 'BT下载器类型。目前仅支持 qBittorrent', example: 'qBittorrent' })
    @Length(0, 16)
    @IsIn(BitTorrentList.map((e) => e.value))
    @IsNotEmpty()
    type: BitTorrentType

    @SetAclCrudField({
        labelWidth: 110,
    })
    @ApiProperty({ title: '服务器地址', description: 'BT服务器地址，例如 http://localhost:8080/', example: 'http://localhost:8080/' })
    @IsUrl({
        require_tld: __PROD__, // 是否要顶级域名
    })
    @IsNotEmpty()
    @Length(0, 1024)
    baseUrl: string

    @ApiProperty({ title: '用户名', example: 'admin' })
    @IsNotEmpty()
    @Length(0, 128)
    username: string

    @SetAclCrudField({
        type: 'password',
    })
    @ApiProperty({ title: '密码', example: 'adminadmin' })
    @IsNotEmpty()
    @Length(0, 128)
    password: string

    @ApiProperty({ title: '下载路径', example: '服务器上的地址，要保存到的路径。留空则为 BT 下载器的默认设置' })
    @Length(0, 256)
    @IsOptional()
    downloadPath?: string

    @SetAclCrudField({
        labelWidth: 110,
    })
    @ApiProperty({ title: '最大体积(B)', description: '过滤资源体积，超过体积的资源不会下载。单位为 B (字节)。设置为 0 禁用', example: 114514 })
    @IsSafeNaturalNumber()
    @IsOptional()
    maxSize?: number

    @SetAclCrudField({
        labelWidth: 125,
    })
    @ApiProperty({ title: '磁盘最小空间(B)', description: '保留磁盘空间的最小值，小于这个值是将不会下载资源。单位为 B (字节)。设置为 0 禁用', example: 114514 })
    @IsSafeNaturalNumber()
    @IsOptional()
    minDiskSize?: number
}
