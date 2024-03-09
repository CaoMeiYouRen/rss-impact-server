import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { User } from '@/db/models/user.entity'
import { CrudQuery } from '@/decorators/crud-query.decorator'
import { UserService } from '@/services/user/user.service'

@ApiTags('user')
@Controller('user')
export class UserController {

    constructor(private readonly userService: UserService) {

    }

    @Get('')
    async find(@CrudQuery('query') query: any) {
        return this.userService.find(query)
    }

    @Get(':id')
    async findOneById(@Param('id') id: number) {
        return this.userService.findOneById(id)
    }

    @Post('')
    async create(@Body() body: User) {
        return this.userService.create(body)
    }

    @Put('')
    async update(@Body() body: User) {
        return this.userService.update(body)
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.userService.delete(id)
    }
}
