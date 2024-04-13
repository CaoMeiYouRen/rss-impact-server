import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, Length, IsEmail } from 'class-validator'

export class RegisterDto {

    @ApiProperty({ description: '用户名', example: 'user' })
    @IsNotEmpty({ message: '用户名不能为空' })
    @Length(0, 128)
    username: string

    @ApiProperty({ description: '密码', example: '123456' })
    @IsNotEmpty({ message: '密码不能为空' })
    @Length(6, 128, { message: '密码不能短于6位' })
    password: string

    @ApiProperty({ description: '邮箱', example: 'user@example.com' })
    @IsNotEmpty({ message: '邮箱不能为空' })
    @IsEmail({}, { message: '邮箱格式有误' })
    @Length(0, 128)
    email: string

}
