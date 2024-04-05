import { Controller, Get, Post } from '@nestjs/common'
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger'
import { AppService } from './app.service'
import { ResponseDto } from './models/response.dto'

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @ApiOkResponse({ // 200
        type: ResponseDto,
    })
    @Get('/')
    getHello() {
        return this.appService.getHello()
    }

    @ApiCreatedResponse({ // 201
        type: ResponseDto,
    })
    @Post('/')
    postHello() {
        return this.appService.getHello()
    }
}
