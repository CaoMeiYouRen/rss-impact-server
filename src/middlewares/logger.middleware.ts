import path from 'path'
import morgan, { StreamOptions } from 'morgan'
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston'
import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { Request } from 'express'
import { isNumberString } from 'class-validator'
import { timeFormat } from '@/utils/helper'
import { __DEV__ } from '@/app.config'
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
            const message = `${ip} - "${requestId}" "${method} ${url}" "HTTP/${httpVersion}" ${status} - ${responseTime} ms`
            if (log.status < 400) {
                winstonLogger.log(message, 'HttpHandle')
            } else {
                winstonLogger.error(`[HttpHandle] ${message}`)
            }
        } catch (error) {
            winstonLogger.error(error?.message, error?.stack)
        }
    },
}

export const fileLogger = morgan('json', { stream })

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
