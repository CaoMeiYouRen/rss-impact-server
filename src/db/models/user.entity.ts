
import { Entity, Column, BeforeInsert, BeforeUpdate, Index } from 'typeorm'
import { hash } from 'bcryptjs'
import { IsEmail, IsNotEmpty, Length } from 'class-validator'
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger'

import { Base } from './base.entity'
import { Role } from '@/constant/role'
import { getAccessToken } from '@/utils/helper'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'

@Entity()
export class User extends Base {

    // constructor(user?: Partial<User>) {
    //     if (user) {
    //         Object.assign(this, user)
    //     }
    // }

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '用户名', example: 'admin' })
    @IsNotEmpty()
    @Length(0, 128)
    @Index('USER_USERNAME_INDEX', { unique: true })
    @Column({
        unique: true,
        length: 128,
    })
    username: string

    @SetAclCrudField({
        type: 'password',
        hide: true,
    })
    @ApiProperty({ title: '密码', example: '123456', required: false })
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

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '邮箱', example: 'admin@example.com' })
    @IsNotEmpty()
    @IsEmail({})
    @Length(0, 128)
    @Index('USER_EMAIL_INDEX', { unique: true })
    @Column({
        unique: true,
        length: 128,
    })
    email: string

    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '角色', example: [Role.admin] })
    @IsNotEmpty()
    @Length(0, 256, { each: true })
    @Column({
        length: 256,
        type: 'simple-array',
    })
    roles: string[]

    @SetAclCrudField({
        addDisplay: false,
        editDisabled: true,
        readonly: true,
    })
    @ApiProperty({ title: '接口访问令牌', description: '接口访问令牌，部分情况可替代账号密码', example: 'rss-impact:fef26d6e-040f-4a7b-8d6a-4e4f12e107b6' })
    // @IsNotEmpty()
    // @Length(0, 128)
    @Index('USER_ACCESS_TOKEN_INDEX', { unique: true })
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

export class FindUser extends FindPlaceholderDto<User> {
    @ApiProperty({ type: () => [User] })
    declare data: User[]
}
