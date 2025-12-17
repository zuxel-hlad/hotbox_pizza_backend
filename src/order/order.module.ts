import { ExtraIngredientEntity } from '@app/extra-ingredient/extra.ingredient.entity';
import { OrderController } from '@app/order/order.controller';
import { OrderEntity } from '@app/order/order.entity';
import { OrderFilterService } from '@app/order/order.filters.service';
import { OrderService } from '@app/order/order.service';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { UserEntity } from '@app/user/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, UserEntity, PizzaEntity, ExtraIngredientEntity])],
  controllers: [OrderController],
  providers: [OrderService, OrderFilterService],
})
export class OrderModule {}
