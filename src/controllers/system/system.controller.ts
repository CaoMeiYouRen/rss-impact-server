import os from 'os'
import fs from 'fs-extra'
import { Controller, Get, Logger } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UseAdmin } from '@/decorators/use-admin.decorator'
import { DATABASE_TYPE } from '@/app.config'
import { DATABASE_PATH, entities } from '@/db/database.module'
import { dataFormat, timeFromNow } from '@/utils/helper'
import { DatabaseInfoDto } from '@/models/database-info.dto'
import { initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { OsInfoDto } from '@/models/os-info.dto'

@UseAdmin()
@ApiTags('system')
@Controller('system')
export class SystemController {

    private readonly logger: Logger = new Logger(SystemController.name)

    @ApiOperation({ summary: '获取数据库信息 option' })
    @Get('getDatabaseInfo/option')
    async getDatabaseInfoOption() {
        return {
            title: '数据库信息',
            submitBtn: false,
            emptyBtn: false,
            column: initAvueCrudColumn(DatabaseInfoDto),
        }
    }

    @ApiResponse({ status: 200, type: DatabaseInfoDto })
    @ApiOperation({ summary: '获取数据库信息' })
    @Get('getDatabaseInfo')
    async getDatabaseInfo() {
        const size = (await fs.stat(DATABASE_PATH))?.size
        const info: DatabaseInfoDto = {
            type: DATABASE_TYPE,
            size,
            sizeFormat: dataFormat(size),
            entitiesLength: entities.length,
        }
        return info
    }

    @ApiOperation({ summary: '获取系统信息 option' })
    @Get('getOsInfo/option')
    async getOsInfoOption() {
        return {
            title: '系统信息',
            submitBtn: false,
            emptyBtn: false,
            column: initAvueCrudColumn(OsInfoDto),
        }
    }

    @ApiResponse({ status: 200, type: OsInfoDto })
    @ApiOperation({ summary: '获取系统信息' })
    @Get('getOsInfo')
    async getOsInfo() {
        const hostname = os.hostname() // 操作系统的主机名
        const type = os.type() // 操作系统名
        const platform = os.platform() // 编译时的操作系统名
        const arch = os.arch() // 操作系统 CPU 架构
        const release = os.release() // 操作系统的发行版本
        const cpuNum = os.cpus().length // CPU 数量
        const totalmem = dataFormat(os.totalmem())// 系统内存总量
        const freemem = dataFormat(os.freemem()) // 系统空闲内存量
        const osUptime = timeFromNow(os.uptime() * 1000) // 系统启动时间 ms(os.uptime() * 1000, { long: true })   // dayjs().add(-os.uptime(), 's').fromNow(true)// 启动时间
        const uptime = timeFromNow(process.uptime() * 1000) // 进程运行时间
        const info: OsInfoDto = {
            nodeVersion: process.versions.node,
            hostname,
            type,
            platform,
            arch,
            release,
            totalmem,
            freemem,
            cpuNum,
            osUptime,
            uptime,
        }
        return info
    }
}

