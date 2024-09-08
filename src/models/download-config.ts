import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, Length } from 'class-validator'
import md5 from 'md5'
import { IsSafeNaturalNumber } from '@/decorators/is-safe-integer.decorator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

export class DownloadConfig {

    @SetAclCrudField({
        labelWidth: 110,
    })
    @ApiProperty({ title: '匹配后缀名', description: '要下载的文件的后缀名，支持正则。例如：.(jpe?g|png|gif|webp|bmp)$', example: '.(jpe?g|png|gif|webp|bmp)$' })
    @IsNotEmpty()
    @Length(0, 256)
    suffixes: string

    @ApiProperty({ title: '跳过文件', description: '要跳过的文件 md5，逗号分割。例如：4cf24fe8401f7ab2eba2c6cb82dffb0e', example: md5('') })
    @Length(0, 256)
    skipHashes: string

    @SetAclCrudField({
        labelWidth: 105,
    })
    @ApiProperty({ title: '超时时间(秒)', description: '默认 60 秒。', example: 60 })
    @IsSafeNaturalNumber(3600)
    @IsOptional()
    timeout?: number
}
