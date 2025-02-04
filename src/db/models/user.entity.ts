
import { Entity, BeforeInsert, BeforeUpdate } from 'typeorm'
import { hash } from 'bcrypt'
import { IsEmail, IsUrl } from 'class-validator'
import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger'
import { Base } from './base.entity'
import { Role } from '@/constant/role'
import { getAccessToken, isAllowedEmail } from '@/utils/helper'
import { SetAclCrudField } from '@/decorators/set-acl-crud-field.decorator'
import { FindPlaceholderDto } from '@/models/find-placeholder.dto'
import { CustomColumn } from '@/decorators/custom-column.decorator'
import { ENABLE_EMAIL_VALIDATION } from '@/app.config'

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
    @CustomColumn({
        index: true,
        unique: true,
        length: 128,
    })
    username: string

    @SetAclCrudField({
        type: 'password',
        hide: true,
    })
    @ApiProperty({ title: '密码', example: '123456', required: false })
    @CustomColumn({
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
    @IsEmail({})
    @CustomColumn({
        index: true,
        unique: true,
        length: 128,
    })
    email: string

    // 入库前校验邮箱是否有效
    @BeforeInsert()
    @BeforeUpdate()
    private async validateEmail() {
        // 如果是 demo 用户 或 管理员，则不校验
        if (this.roles.includes(Role.demo) || this.roles.includes(Role.admin)) {
            return
        }
        if (ENABLE_EMAIL_VALIDATION && this.email && !isAllowedEmail(this.email)) {
            throw new Error(`邮箱地址 ${this.email} 不在允许的域名内`)
        }
    }

    // 邮箱是否验证
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '邮箱已验证', example: true })
    @CustomColumn({
        default: false,
        nullable: true,
    })
    emailVerified: boolean

    // 禁用密码登录，原因是第三方登录时，密码是随机生成的
    @SetAclCrudField({
        search: true,
    })
    @ApiProperty({ title: '禁用密码登录', example: false })
    @CustomColumn({
        default: false,
        nullable: true,
    })
    disablePasswordLogin: boolean

    // 头像
    @SetAclCrudField({
        type: 'img',
    })
    @ApiProperty({ title: '头像', example: 'URL_ADDRESS', required: false })
    @IsUrl({})
    @CustomColumn({
        length: 1024,
        nullable: true,
    })
    avatar?: string

    @SetAclCrudField({
        type: 'select',
        multiple: true,
        search: true,
        value: [Role.user],
        dicData: Object.entries(Role).map(([key, value]) => ({
            label: key,
            value,
        })),
    })
    @ApiProperty({ title: '角色', example: [Role.admin] })
    @CustomColumn({
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
    @CustomColumn({
        index: true,
        unique: true,
        length: 128,
        nullable: true,
    })
    accessToken: string

    @BeforeInsert()
    @BeforeUpdate()
    private createAccessToken() { // 初始化 accessToken
        if (!this.accessToken) {
            this.accessToken = getAccessToken('rss-impact')
        }
    }

    @SetAclCrudField({
        search: true,
        addDisplay: false,
        editDisabled: true,
        readonly: true,
    })
    @ApiProperty({ title: 'Auth0 ID', description: '绑定的 auth0 账号', example: 'github|114514', required: false })
    @CustomColumn({
        index: true,
        unique: true,
        length: 128,
        nullable: true,
    })
    auth0Id?: string

}

export class CreateUser extends OmitType(User, ['id', 'createdAt', 'updatedAt', 'accessToken'] as const) { }

export class UpdateUser extends PartialType(OmitType(User, ['createdAt', 'updatedAt', 'accessToken'] as const)) { }

export class UpdateMe extends PartialType(PickType(User, ['id', 'username', 'email'] as const)) { }

export class FindUser extends FindPlaceholderDto<User> {
    @ApiProperty({ type: () => [User] })
    declare data: User[]
}
