import { OrderFilterService } from '@modules/order/order-filters.service';
import { OrderController } from '@modules/order/order.controller';
import { OrderEntity } from '@modules/order/order.entity';
import { OrderService } from '@modules/order/order.service';
import { UserEntity } from '@modules/user/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, UserEntity])],
  controllers: [OrderController],
  providers: [OrderService, OrderFilterService],
})
export class OrderModule {}
