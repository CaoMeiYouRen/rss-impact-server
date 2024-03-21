import { Global, Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CommonModule } from './common/common.module'
import { UserService } from './services/user/user.service'
import { DatabaseModule } from './db/database.module'
import { UserController } from './controllers/user/user.controller'
import { AuthController } from './controllers/auth/auth.controller'
import { AuthService } from './services/auth/auth.service'
import { LocalStrategy } from './strategies/local.strategy'
import { SessionStrategy } from './strategies/session.strategy'
import { TokenStrategy } from './strategies/token.strategy'
import { FeedController } from './controllers/feed/feed.controller'
import { CategoryController } from './controllers/category/category.controller'
import { ArticleController } from './controllers/article/article.controller'
import { TasksService } from './services/tasks/tasks.service'

@Global()
@Module({
    imports: [
        CommonModule,
        DatabaseModule,
    ],
    exports: [
        AppService,
        UserService,
        AuthService,
    ],
    controllers: [
        AppController,
        UserController,
        AuthController,
        FeedController,
        CategoryController,
        ArticleController,
    ],
    providers: [
        AppService,
        UserService,
        AuthService,
        LocalStrategy,
        SessionStrategy,
        TokenStrategy,
        TasksService,
    ],
})
export class AppModule { }
