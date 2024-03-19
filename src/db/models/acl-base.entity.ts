import { ManyToOne } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Base } from './base.entity'
import { User } from './user.entity'

export class AclBase extends Base {

    // acl

    @ApiProperty({ description: '所属用户', example: 1 })
    @ManyToOne(() => User)
    user: User
}
