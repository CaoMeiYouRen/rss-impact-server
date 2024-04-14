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

morgan.format('app-combined', '[HttpHandle] :remote-addr - ":method :url HTTP/:http-version" :status - :response-time ms')
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
const stream: StreamOptions = {
    // Use the http severity
    write: (message) => winstonLogger.log(message), // winston.http(message),
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
        new winston.transports.Http({
            level: 'info',
            // host: 'localhost',
            // port: 3000,
            // path: '/',
        }),
        new DailyRotateFile({
            dirname: logDir,
            filename: '%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '31d',
            format,
        }),
        new DailyRotateFile({
            level: 'error',
            dirname: logDir,
            filename: '%DATE%.errors.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '31d',
            format,
        }),
        // new winston.transports.File({
        //     dirname: logDir,
        //     filename: 'errors.log',
        //     level: 'error',
        //     format,
        // }),
    ],
    exceptionHandlers: [
        // new winston.transports.File({
        //     dirname: logDir,
        //     filename: 'exceptions.log',
        //     format,
        // }),
        new DailyRotateFile({
            level: 'error',
            dirname: logDir,
            filename: '%DATE%.exceptions.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '31d',
            format,
        }),
    ],
    rejectionHandlers: [
        // new winston.transports.File({
        //     dirname: logDir,
        //     filename: 'rejections.log',
        //     format,
        // }),
        new DailyRotateFile({
            level: 'error',
            dirname: logDir,
            filename: '%DATE%.rejections.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '31d',
            format,
        }),
    ],
})
