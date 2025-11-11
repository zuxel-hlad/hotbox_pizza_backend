import { AppController } from '@app/app/app.controller';
import { AppService } from '@app/app/app.service';
import { AuthModule } from '@app/auth/auth.module';
import ormConfig from '@app/orm/orm.config';
import { TokenModule } from '@app/token/token.module';
import { AuthMiddleware } from '@app/user/middleware/auth.middleware';
import { UserModule } from '@app/user/user.module';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(ormConfig),
    TokenModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
