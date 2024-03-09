import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { DbModule } from './db/db.module'
import { UserController } from './controllers/user/user.controller'
import { UserService } from './services/user/user.service'

@Module({
    imports: [
        CommonModule,
        // DbModule,
    ],
    controllers: [
        AppController,
        // UserController,
    ],
    providers: [AppService, UserService],
})
export class AppModule { }
