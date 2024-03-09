import os from 'os'
import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'
import { HttpError } from './models/http-error'
import { sleep } from './utils/helper'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name, version } = require('../package.json')

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get('/')
    getHello() {
        return this.appService.getHello()
    }

}
