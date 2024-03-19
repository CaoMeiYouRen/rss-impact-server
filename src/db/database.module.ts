import path from 'path'
import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './models/user.entity'

export const DATABASE_PATH = path.join(__dirname, '../../data/database.sqlite')

const entities = [User]

const repositories = TypeOrmModule.forFeature(entities)

@Global()
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory() {
                return {
                    // TODO mysql 支持
                    type: 'sqlite',
                    database: DATABASE_PATH,
                    entities,
                    synchronize: true,
                    autoLoadEntities: true,
                }
            },
        }),
        repositories,
    ],
    exports: [repositories],
})
export class DatabaseModule { }
