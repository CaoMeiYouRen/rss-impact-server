import { ApiProperty } from '@nestjs/swagger'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

export class OsInfoDto {

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: 'Node.js 版本', description: '', example: '' })
    nodeVersion: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: '主机名', description: '', example: '' })
    hostname: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: '操作系统类型', description: '', example: '' })
    type: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: '操作系统平台', description: '', example: '' })
    platform: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: '系统架构', description: '', example: '' })
    arch: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: '系统版本', description: '', example: '' })
    release: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: '总内存', description: '', example: '' })
    totalmem: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: '可用内存', description: '', example: '' })
    freemem: string

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: 'CPU 内核数', description: '', example: '' })
    cpuNum: number

    @SetAclCrudField({
        readonly: true,
        editDisabled: true,
        span: 24,
        labelWidth: 130,
    })
    @ApiProperty({ title: '运行时间', description: '', example: '' })
    uptime: string
}
