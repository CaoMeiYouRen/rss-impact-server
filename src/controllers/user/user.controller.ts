import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Session } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { User } from '@/db/models/user.entity'
import { CrudQuery } from '@/decorators/crud-query.decorator'
import { UserService } from '@/services/user/user.service'
import { CurrentUser } from '@/decorators/current-user.decorator'
import { Auth } from '@/decorators/auth.decorator'

@Auth()
@ApiTags('user')
@Controller('user')
export class UserController {

    private readonly logger: Logger = new Logger(UserController.name)

    constructor(private readonly userService: UserService) {

    }

    @Get('')
    async find(@CrudQuery('query') query: any) {
        return this.userService.find(query)
    }

    @Get('me')
    @ApiOperation({ summary: '获取个人信息' })
    @ApiResponse({ status: 200, type: User })
    async getMe(@CurrentUser() user: User, @Session() session: Record<string, any>) {
        this.logger.debug('session', JSON.stringify(session, null, 4))
        return user
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
