import { ApiProperty } from '@nestjs/swagger'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

export class DatabaseInfoDto {

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
    })
    @ApiProperty({ title: '类型', description: '参考 typeorm 支持的数据库类型。', example: 'sqlite' })
    type: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        hide: true,
    })
    @ApiProperty({ title: '体积(B)', description: '单位为 B', example: 114514 })
    size: number

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
    })
    @ApiProperty({ title: '体积(B)', description: '单位为 B', example: '114.51 MiB' })
    sizeFormat: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
    })
    @ApiProperty({ title: '实体类数量', description: 'typeorm 的实体类数量，即 SQL 表数量', example: 10 })
    entitiesLength: number
}
