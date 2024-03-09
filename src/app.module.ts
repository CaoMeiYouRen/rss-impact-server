import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { UserService } from './services/user/user.service'
import { DatabaseModule } from './db/database.module'
import { UserController } from './controllers/user/user.controller'
import { AuthController } from './controllers/auth/auth.controller'
import { AuthService } from './services/auth/auth.service'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
    imports: [
        CommonModule,
        DatabaseModule,
    ],
    controllers: [
        AppController,
        UserController,
        AuthController,
    ],
    providers: [
        AppService,
        UserService,
        AuthService,
        LocalStrategy,
    ],
})
export class AppModule { }
