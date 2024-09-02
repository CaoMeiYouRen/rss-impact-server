import os from 'os'
import fs from 'fs-extra'
import { Controller, Get, Logger } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import sqlite3 from 'sqlite3'
import mysql, { ConnectionOptions } from 'mysql2/promise'
import ms from 'ms'
import { UseAdmin } from '@/decorators/use-admin.decorator'
import { DATABASE_CHARSET, DATABASE_DATABASE, DATABASE_HOST, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_TIMEZONE, DATABASE_TYPE, DATABASE_USERNAME } from '@/app.config'
import { DATABASE_PATH, entities } from '@/db/database.module'
import { dataFormat, timeFromNow } from '@/utils/helper'
import { DatabaseInfoDto } from '@/models/database-info.dto'
import { initAvueCrudColumn } from '@/decorators/acl-crud.decorator'
import { OsInfoDto } from '@/models/os-info.dto'
import { AvueCrudOption } from '@/models/avue.dto'

@UseAdmin()
@ApiTags('system')
@Controller('system')
export class SystemController {

    private readonly logger: Logger = new Logger(SystemController.name)

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

            info.size = (await fs.stat(DATABASE_PATH))?.size
            info.sizeFormat = dataFormat(info.size)

            const db = new sqlite3.Database(DATABASE_PATH, (error) => {
                if (error) {
                    this.logger.error(error?.message, error?.stack)
                }
            })

            const { count: tableCount } = await new Promise<{ count: number }>((resolve, reject) => {
                db.get<{ count: number }>('SELECT COUNT(*) AS count FROM sqlite_master WHERE type = "table"', (error, row) => {
                    if (error) {
                        reject(error)
                        return
                    }
                    resolve(row)
                })
            })
            info.tableCount = tableCount

            const { count: indexCount } = await new Promise<{ count: number }>((resolve, reject) => {
                db.get<{ count: number }>('SELECT COUNT(*) AS count FROM sqlite_master WHERE type = "index"', (error, row) => {
                    if (error) {
                        reject(error)
                        return
                    }
                    resolve(row)
                })
            })
            info.indexCount = indexCount

            db.close((error) => {
                if (error) {
                    this.logger.error(error?.message, error?.stack)
                }
            })

        } else if (DATABASE_TYPE === 'mysql') {
            const options: ConnectionOptions = {
                host: DATABASE_HOST,
                port: DATABASE_PORT,
                user: DATABASE_USERNAME,
                password: DATABASE_PASSWORD,
                database: DATABASE_DATABASE,
                charset: DATABASE_CHARSET, // 连接的字符集。
                timezone: DATABASE_TIMEZONE,
                connectTimeout: ms('60 s'), // 在连接到 MySQL 服务器期间发生超时之前的毫秒数
                supportBigNumbers: true, // 处理数据库中的大数字
                bigNumberStrings: false, // 仅当它们无法用 JavaScript Number 对象准确表示时才会返回大数字作为 String 对象
            }

            const db = await mysql.createConnection(options)

            const [databaseResults] = await db.query(`
                SELECT table_schema AS \`database\`,
                       SUM(data_length + index_length) AS \`size\`
                FROM information_schema.TABLES
                WHERE table_schema = ?
                GROUP BY table_schema;
              `, [DATABASE_DATABASE])

            info.size = Number(databaseResults?.[0]?.size) || 0 // 数据表数量
            info.sizeFormat = dataFormat(info.size)

            const [tableResults] = await db.query(`
                SELECT COUNT(*) AS \`tableCount\`
                FROM information_schema.TABLES
                WHERE table_schema = ?;
              `, [DATABASE_DATABASE])
            info.tableCount = Number(tableResults?.[0]?.tableCount) || 0  // 表数量

            const [indexResults] = await db.query(`
                SELECT COUNT(*) AS \`indexCount\`
                FROM information_schema.STATISTICS
                WHERE table_schema = ?;
              `, [DATABASE_DATABASE])
            info.indexCount = Number(indexResults?.[0]?.indexCount) || 0 // 索引数量

            await db.end()
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
}

