import { Column, ManyToOne } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Base } from './base.entity'
import { User } from './user.entity'

export class AclBase extends Base {

    // acl

    @Column({ nullable: true })
    userId: number

    @ApiProperty({ description: '所属用户', example: 1, type: () => User })
    @ManyToOne(() => User)
    user: User

}
