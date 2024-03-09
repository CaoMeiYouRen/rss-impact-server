import path from 'path'
import { DataSource } from 'typeorm'
import { User } from './models/user.entity'
// import { MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE } from '@/app.config'

export const DATA_SOURCE = 'DATA_SOURCE'
export const USER_REPOSITORY = 'USER_REPOSITORY'

export const databaseProviders = [
    {
        provide: DATA_SOURCE,
        useFactory: async () => {
            const dataSource = new DataSource({
                // type: 'mysql',
                // host: MYSQL_HOST,
                // port: MYSQL_PORT,
                // username: MYSQL_USERNAME,
                // password: MYSQL_PASSWORD,
                // database: MYSQL_DATABASE,
                // TODO 适配更多数据库
                type: 'sqlite',
                database: path.join(__dirname, '../../data/database.sqlite'),
                entities: [
                    path.join(__dirname, './models/*{.ts,.js}'),
                ],
                synchronize: true,
            })

            return dataSource.initialize()
        },
    },
    {
        provide: USER_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
        inject: [DATA_SOURCE],
    },
]
