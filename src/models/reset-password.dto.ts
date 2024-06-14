import { ApiProperty } from '@nestjs/swagger'
import { Length } from 'class-validator'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'

export class ResetPasswordDto {

    @SetAclCrudField({
        type: 'password',
    })
    @ApiProperty({ title: '旧密码', example: '123456' })
    @Length(6, 256, { message: '旧密码不能短于6位' })
    oldPassword: string

    @SetAclCrudField({
        type: 'password',
    })
    @ApiProperty({ title: '新密码', example: '654123' })
    @Length(6, 256, { message: '新密码不能短于6位' })
    newPassword: string
}
