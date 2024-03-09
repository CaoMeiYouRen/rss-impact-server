
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, Index } from 'typeorm'
import { hash, hashSync } from 'bcryptjs'
import { IsEmail, Length } from 'class-validator'

@Entity()
export class User {

    // constructor(user?: Partial<User>) {
    //     if (user) {
    //         Object.assign(this, user)
    //     }
    // }

    @PrimaryGeneratedColumn()
    id: number

    // @IsNotEmpty()
    @Length(0, 128)
    @Index('USER_USERNAME_INDEX')
    @Column({
        unique: true,
        length: 128,
    })
    username: string

    @Length(0, 128)
    @Column({
        length: 128,
        select: false,
    })
    password: string

    @BeforeInsert()
    @BeforeUpdate()
    hashPassword() {
        if (this.password) {
            this.password = hashSync(this.password, 10)
        }
    }

    @IsEmail({})
    @Length(0, 128)
    @Index('USER_EMAIL_INDEX')
    @Column({
        unique: true,
        length: 128,
    })
    email: string

    @Length(0, 256, { each: true })
    @Column({
        length: 256,
        type: 'simple-array',
    })
    roles: string[]

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}

