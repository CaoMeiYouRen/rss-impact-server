import { Global, Module } from '@nestjs/common'
import { TypegooseModule } from 'nestjs-typegoose-next'
import { User } from './models/User.model'
import { MONGODB_URL, MONGODB_USER, MONGODB_PASSWORD } from '@/app.config'

const models = TypegooseModule.forFeature([
    User,
])

@Global()
@Module({
    imports: [
        models,
        TypegooseModule.forRootAsync({
            useFactory() {
                return {
                    uri: MONGODB_URL,
                    auth: {
                        username: MONGODB_USER,
                        password: MONGODB_PASSWORD,
                    },
                    // useNewUrlParser: true,
                    // useUnifiedTopology: true,
                    // useCreateIndex: true,
                    // useFindAndModify: false,
                }
            },
        }),
    ],
    exports: [
        models,
    ],
})
export class DbModule { }
