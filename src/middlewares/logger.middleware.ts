import path from 'path'
import morgan, { StreamOptions } from 'morgan'
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston'
import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { timeFormat } from '@/utils/helper'
import { __DEV__ } from '@/app.config'

const logDir = path.resolve('logs')
morgan.token('time', () => timeFormat(Date.now(), 'YYYY-MM-DD HH:mm:ss.SSSZ'))
morgan.token('time-short', () => timeFormat(Date.now(), 'HH:mm:ss.SSS'))
//  [HttpHandle] ::ffff:127.0.0.1 - "GET /api/user/dicData" "HTTP/1.1" [304] - 10.974 ms
morgan.format('app-combined', '[HttpHandle] :remote-addr - ":method :url" "HTTP/:http-version" [:status] - :response-time ms')
morgan.format('console-combined', '[:time-short] :remote-addr - ":method :url HTTP/:http-version" :status - :response-time ms')

// const accessLogStream = getStream({
//     date_format: 'YYYY-MM-DD',
//     filename: path.join(logDir, '%DATE%'),
//     extension: '.log',
//     audit_file: path.join(logDir, '.audit.json'),
//     frequency: 'daily',
//     verbose: false,
//     size: '1g',
//     max_logs: '30d',
// })
const statusCodeRegex = /\[(\d+)\]/ // 正则表达式匹配 [xxx]
const stream: StreamOptions = {
    // Use the http severity
    write: (message) => {
        // 使用正则从日志消息中提取状态码
        const match = message.match(statusCodeRegex)
        const status = match ? parseInt(match[1]) : 0
        const logLevel = status >= 400 ? 'error' : 'info'

        if (logLevel === 'error') {
            winstonLogger.error(message)
        } else {
            winstonLogger.log(message)
        }
    },
}

// export const consoleLogger = morgan('console-combined', {})
export const fileLogger = morgan('app-combined', { stream })

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSSZ' }),
    // winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('rss-impact-server', {
        colors: false,
        prettyPrint: true,
    }),
)

const dailyRotateFileOption = {
    dirname: logDir,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
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
                winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS' }),
                winston.format.ms(),
                nestWinstonModuleUtilities.format.nestLike('rss-impact-server', {
                    colors: true,
                    prettyPrint: true,
                }),
            ),
        }),
        // new winston.transports.Http({
        //     level: 'info',
        // }),
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
            filename: '%DATE%.exceptions.log',
        }),
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            ...dailyRotateFileOption,
            level: 'error',
            filename: '%DATE%.rejections.log',
        }),
    ],
})
