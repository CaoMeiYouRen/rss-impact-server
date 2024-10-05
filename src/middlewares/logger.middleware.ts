import path from 'path'
import morgan, { StreamOptions } from 'morgan'
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston'
import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { Request } from 'express'
import { isNumberString } from 'class-validator'
import { Logger, QueryRunner } from 'typeorm'
import { LoggerService } from '@nestjs/common'
import { timeFormat } from '@/utils/helper'
import { __DEV__, __PROD__ } from '@/app.config'
import { User } from '@/db/models/user.entity'

const logDir = path.resolve('logs')

morgan.token('user', (req: Request) => {
    const user = req.user as User
    return user?.id ? String(user?.id) : ''
})
morgan.token('request-id', (req: Request) => req.header('X-Request-Id') || '')
morgan.token('content-type', (req: Request) => req.header('content-type'))
morgan.token('time', () => timeFormat(Date.now(), 'YYYY-MM-DD HH:mm:ss.SSSZ'))

morgan.format('app-combined', ':remote-addr - ":method :url" "HTTP/:http-version" [:status] - :response-time ms')
// morgan.format('console-combined', '[:time-short] :remote-addr - ":method :url HTTP/:http-version" :status - :response-time ms')

morgan.format('json', JSON.stringify({
    ip: ':remote-addr',
    method: ':method',
    url: ':url',
    httpVersion: ':http-version',
    status: ':status',
    // body: ':body',
    // headers: ':headers',
    responseTime: ':response-time',
    referrer: ':referrer',
    userAgent: ':user-agent',
    contentType: ':content-type',
    user: ':user',
    requestId: ':request-id',
}))

const stream: StreamOptions = {
    // Use the http severity
    write: (line: string) => {
        try {
            const log = JSON.parse(line)
            if (isNumberString(log.status)) {
                log.status = Number(log.status)
            }
            const { ip, method, url, httpVersion, status, responseTime, requestId } = log
            if (__PROD__ && /(\/assets|\/vite\.svg)/.test(url)) { // 生产环境忽略静态文件日志
                return
            }
            const message = `${ip} - "${requestId}" "${method} ${url}" "HTTP/${httpVersion}" ${status} - ${responseTime} ms`
            if (log.status < 400) {
                winstonLogger.log(message, 'HttpHandle')
                return
            }
            winstonLogger.error(`[HttpHandle] ${message}`)
        } catch (error) {
            winstonLogger.error(error?.message, error?.stack)
        }
    },
}

export const jsonLogger = morgan('json', { stream })

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
    // winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('rss-impact-server', {
        colors: false,
        prettyPrint: true,
    }),
)

const dailyRotateFileOption = {
    dirname: logDir,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxSize: '20m',
    maxFiles: '31d',
    format,
    auditFile: path.join(logDir, '.audit.json'),
}

export const winstonLogger = WinstonModule.createLogger({
    level: __DEV__ ? 'silly' : 'http',
    exitOnError: false,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                winston.format.ms(),
                nestWinstonModuleUtilities.format.nestLike('rss-impact-server', {
                    colors: true,
                    prettyPrint: true,
                }),
            ),
        }),
        new DailyRotateFile({
            ...dailyRotateFileOption,
            filename: '%DATE%.log',
        }),
        new DailyRotateFile({
            ...dailyRotateFileOption,
            level: 'error',
            filename: '%DATE%.errors.log',
        }),
    ],
    exceptionHandlers: [
        new DailyRotateFile({
            ...dailyRotateFileOption,
            level: 'error',
            filename: '%DATE%.errors.log',
        }),
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            ...dailyRotateFileOption,
            level: 'error',
            filename: '%DATE%.errors.log',
        }),
    ],
})

export const logger = winstonLogger

function parametersFormat(parameters: any[]) {
    if (!parameters?.length) {
        return ''
    }
    return `\n${parameters.map((parameter) => {
        if (parameter instanceof Date) {
            return `'${parameter.toISOString()}'`
        }
        if (typeof parameter === 'string') {
            return `'${parameter}'`
        }
        return `${parameter}`
    }).join(', ')}`
}

export class CustomLogger implements Logger {
    constructor(private readonly loggerService: LoggerService) { }

    logQuery(query: string, parameters?: any[]): any {
        this.loggerService.verbose(`Query: ${query}${parametersFormat(parameters)}`)
    }

    logQueryError(error: string | Error, query: string, parameters?: any[]): any {
        this.loggerService.error(`Query Error: ${error}\nQuery: ${query}${parametersFormat(parameters)}`)
    }

    logQuerySlow(time: number, query: string, parameters?: any[]): any {
        this.loggerService.warn(`Slow Query (${time}ms): ${query}${parametersFormat(parameters)}`)
    }

    logSchemaBuild(message: string): any {
        this.loggerService.verbose(`Schema Build: ${message}`)
    }

    logMigration(message: string): any {
        this.loggerService.log(`Migration: ${message}`)
    }

    log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner): any {
        switch (level) {
            case 'log':
                this.loggerService.log(message, queryRunner)
                break
            case 'info':
                this.loggerService.log(message, queryRunner)
                break
            case 'warn':
                this.loggerService.warn(message, queryRunner)
                break
            default:
                this.loggerService.verbose(message, queryRunner)
                break
        }
    }
}
