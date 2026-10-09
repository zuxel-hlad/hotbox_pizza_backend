import ormConfig from '@core/database/database.config';
import { AuthMiddleware } from '@core/middleware/auth.middleware';
import { AuthModule } from '@modules/auth/auth.module';
import { ExtraIngredientModule } from '@modules/extra-ingredient/extra-ingredient.module';
import { OrderModule } from '@modules/order/order.module';
import { PizzaModule } from '@modules/pizza/pizza.module';
import { TokenModule } from '@modules/token/token.module';
import { UserModule } from '@modules/user/user.module';
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
    PizzaModule,
    ExtraIngredientModule,
    OrderModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
