
import { Entity, Column, BeforeInsert, BeforeUpdate, Index } from 'typeorm'
import { hash } from 'bcryptjs'
import { IsEmail, IsNotEmpty, Length } from 'class-validator'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'
import { Base } from './base.entity'
import { Role } from '@/constant/role'
import { getAccessToken } from '@/utils/helper'

@Entity()
export class User extends Base {

    // constructor(user?: Partial<User>) {
    //     if (user) {
    //         Object.assign(this, user)
    //     }
    // }

    @ApiProperty({ description: '用户名', example: 'admin' })
    @IsNotEmpty()
    @Length(0, 128)
    @Index('USER_USERNAME_INDEX')
    @Column({
        unique: true,
        length: 128,
    })
    username: string

    @ApiProperty({ description: '密码', example: '123456' })
    @IsNotEmpty()
    @Length(0, 128)
    @Column({
        length: 128,
        select: false,
    })
    password: string

    @BeforeInsert()
    @BeforeUpdate()
    private async hashPassword() {
        if (this.password) {
            this.password = await hash(this.password, 10)
        }
    }

    @ApiProperty({ description: '邮箱', example: 'admin@example.com' })
    @IsNotEmpty()
    @IsEmail({})
    @Length(0, 128)
    @Index('USER_EMAIL_INDEX')
    @Column({
        unique: true,
        length: 128,
    })
    email: string

    @ApiProperty({ description: '角色', example: [Role.admin] })
    @IsNotEmpty()
    @Length(0, 256, { each: true })
    @Column({
        length: 256,
        type: 'simple-array',
    })
    roles: string[]

    @ApiProperty({ description: '接口访问令牌，部分情况可替代账号密码', example: getAccessToken() })
    @IsNotEmpty()
    @Length(0, 128, { each: true })
    @Index('USER_ACCESS_TOKEN_INDEX')
    @Column({
        unique: true,
        length: 128,
        // default: getAccessToken(),
    })
    accessToken: string

    @BeforeInsert()
    @BeforeUpdate()
    private createAccessToken() { // 初始化 accessToken
        if (!this.accessToken) {
            this.accessToken = getAccessToken()
        }
    }

}

export class CreateUser extends OmitType(User, ['id', 'createdAt', 'updatedAt', 'accessToken'] as const) { }

export class UpdateUser extends PartialType(OmitType(User, ['createdAt', 'updatedAt', 'accessToken'] as const)) { }
