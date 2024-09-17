import os from 'os'
import fs from 'fs-extra'
import { Controller, Get, Logger, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { UseAdmin } from '@/decorators/use-admin.decorator'
import { DATABASE_DATABASE, DATABASE_TYPE } from '@/app.config'
import { DATABASE_PATH, entities } from '@/db/database.module'
import { dataFormat, timeFromNow } from '@/utils/helper'
import { DatabaseInfoDto } from '@/models/database-info.dto'
import { initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { OsInfoDto } from '@/models/os-info.dto'
import { AvueCrudOption } from '@/models/avue.dto'
import { ResponseDto } from '@/models/response.dto'
import { HttpError } from '@/models/http-error'

@UseAdmin()
@ApiTags('system')
@Controller('system')
export class SystemController {

    private readonly logger: Logger = new Logger(SystemController.name)

    constructor(@InjectDataSource() private readonly dataSource: DataSource) {

    }

    @ApiResponse({ status: 200, type: AvueCrudOption })
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
        const info: DatabaseInfoDto = {
            type: DATABASE_TYPE,
            size: 0,
            sizeFormat: dataFormat(0),
            entitiesLength: entities.length,
            tableCount: 0,
            indexCount: 0,
        }
        if (DATABASE_TYPE === 'sqlite') {
            try {
                info.size = (await fs.stat(DATABASE_PATH))?.size
                info.sizeFormat = dataFormat(info.size)

                const tableResults = await this.dataSource.query<[{ count: number }]>('SELECT COUNT(*) AS count FROM sqlite_master WHERE type = "table"')
                info.tableCount = tableResults?.[0]?.count

                const indexResults = await this.dataSource.query<[{ count: number }]>('SELECT COUNT(*) AS count FROM sqlite_master WHERE type = "index"')
                info.indexCount = indexResults?.[0]?.count
            } catch (error) {
                this.logger.error(error?.message, error?.stack)
            }
        } else if (DATABASE_TYPE === 'mysql') {
            try {
                const [databaseResults] = await this.dataSource.query<[{ database: string, size: string }]>(`
                    SELECT table_schema AS \`database\`,
                           SUM(data_length + index_length) AS \`size\`
                    FROM information_schema.TABLES
                    WHERE table_schema = ?
                    GROUP BY table_schema;
                  `, [DATABASE_DATABASE])

                info.size = Number(databaseResults?.size) || 0 // 数据库占用体积
                info.sizeFormat = dataFormat(info.size)

                const [tableResults] = await this.dataSource.query<[{ tableCount: number }]>(`
                   SELECT COUNT(*) AS \`tableCount\`
                   FROM information_schema.TABLES
                   WHERE table_schema = ?;
                 `, [DATABASE_DATABASE])
                info.tableCount = tableResults?.tableCount || 0  // 表数量

                const [indexResults] = await this.dataSource.query<[{ indexCount: number }]>(`
                   SELECT COUNT(*) AS \`indexCount\`
                   FROM information_schema.STATISTICS
                   WHERE table_schema = ?;
                 `, [DATABASE_DATABASE])
                info.indexCount = indexResults?.indexCount || 0 // 索引数量

            } catch (error) {
                this.logger.error(error?.message, error?.stack)
            }
        } else if (DATABASE_TYPE === 'postgres') {
            try {
                // 查询整个数据库的大小
                const [databaseResults] = await this.dataSource.query<[{ pg_database_size: number }]>('SELECT pg_database_size($1)', [DATABASE_DATABASE])
                info.size = databaseResults.pg_database_size || 0 // 数据库占用体积
                info.sizeFormat = dataFormat(info.size)

                // 查询表的数量
                const [tableResults] = await this.dataSource.query<[{ count: number }]>('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\';')
                info.tableCount = tableResults.count || 0

                // 查询索引的数量
                const [indexResults] = await this.dataSource.query<[{ count: number }]>('SELECT COUNT(*) FROM pg_indexes WHERE schemaname = \'public\';')
                info.indexCount = indexResults.count || 0

            } catch (error) {
                this.logger.error(error?.message, error?.stack)
            }
        }

        return info
    }

    @ApiResponse({ status: 200, type: AvueCrudOption })
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

    @ApiResponse({ status: 201, type: ResponseDto })
    @ApiOperation({ summary: '释放 sqlite 数据库未使用空间' })
    @Post('sqliteVacuum')
    async sqliteVacuum() {
        if (DATABASE_TYPE !== 'sqlite') {
            throw new HttpError(400, '本接口仅支持 sqlite 作为数据库时调用')
        }
        this.logger.log('正在触发 VACUUM')
        await this.dataSource.query('VACUUM;')
        this.logger.log('VACUUM 执行成功')
        return new ResponseDto({ message: 'OK' })
    }
}

