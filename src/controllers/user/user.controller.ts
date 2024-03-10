import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Session } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateUser, UpdateUser, User } from '@/db/models/user.entity'
import { CrudQuery } from '@/decorators/crud-query.decorator'
import { UserService } from '@/services/user/user.service'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { Auth } from '@/decorators/auth.decorator'
import { UseSession } from '@/decorators/use-session.decorator'
import { UseAdmin } from '@/decorators/use-admin.decorator'

@UseSession()
@ApiTags('user')
@Controller('user')
export class UserController {

    private readonly logger: Logger = new Logger(UserController.name)

    constructor(private readonly userService: UserService) {

    }

    @UseAdmin()
    @Get('')
    async find(@CrudQuery('query') query: any) {
        return this.userService.find(query)
    }

    @Get('me')
    @ApiOperation({ summary: '获取个人信息' })
    @ApiResponse({ status: 200, type: User })
    async getMe(@CurrentUser() user: User) {
        return user
    }

    @UseAdmin()
    @Get(':id')
    async findOneById(@Param('id') id: number) {
        return this.userService.findOneById(id)
    }

    @UseAdmin()
    @Post('')
    async create(@Body() body: CreateUser) {
        return this.userService.create(body)
    }

    @UseAdmin()
    @Put('')
    async update(@Body() body: UpdateUser) {
        return this.userService.update(body)
    }

    @UseAdmin()
    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.userService.delete(id)
    }
}
