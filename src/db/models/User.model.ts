import { prop, modelOptions, DocumentType, ReturnModelType } from '@typegoose/typegoose'
import { ApiProperty } from '@nestjs/swagger'
import { hashSync } from 'bcryptjs'
import { IsNotEmpty, Length } from 'class-validator'

/**
 *用户类
 *
 * @author CaoMeiYouRen
 * @export
 * @class User
 */
@modelOptions({
    schemaOptions: {
        versionKey: false,
        timestamps: true,
        collection: 'User',
    },
})
export class User {

    @IsNotEmpty({ message: 'username 不能为空' })
    @prop({
        required: true,
        index: true,
        unique: true,
    })
    @ApiProperty({ description: '用户名', example: 'admin' })
    username: string

    @IsNotEmpty({ message: 'password 不能为空' })
    @Length(6)
    @ApiProperty({ description: '密码', example: '123456' })
    @prop({
        select: false,
        required: true,
        get(val) {
            return val
        },
        set(val) {
            return val ? hashSync(val) : val
        },
    })
    password: string

}

export type UserDocument = DocumentType<User>

export type UserModel = ReturnModelType<typeof User>
