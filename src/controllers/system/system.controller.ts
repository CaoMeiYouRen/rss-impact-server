import fs from 'fs-extra'
import { Controller, Get, Logger } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UseAdmin } from '@/decorators/use-admin.decorator'
import { DATABASE_TYPE } from '@/app.config'
import { DATABASE_PATH } from '@/db/database.module'
import { dataFormat } from '@/utils/helper'
import { DatabaseInfoDto } from '@/models/database-info.dto'
import { initAvueCrudColumn } from '@/decorators/acl-crud.decorator'

@UseAdmin()
@ApiTags('system')
@Controller('system')
export class SystemController {

    private readonly logger: Logger = new Logger(SystemController.name)

    @ApiOperation({ summary: '获取数据库信息' })
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
        }
        return info
    }

}
