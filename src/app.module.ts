import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { UserService } from './services/user/user.service'
import { DatabaseModule } from './db/database.module'
import { UserController } from './controllers/user/user.controller'

@Module({
    imports: [
        CommonModule,
        DatabaseModule,
    ],
    controllers: [
        AppController,
        UserController,
    ],
    providers: [AppService, UserService],
})
export class AppModule { }
