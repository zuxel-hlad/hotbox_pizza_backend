import { PizzaController } from '@app/pizza/pizza.controller';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { PizzaService } from '@app/pizza/pizza.service';
import { UserEntity } from '@app/user/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([PizzaEntity, UserEntity])],
  controllers: [PizzaController],
  providers: [PizzaService],
})
export class PizzaModule {}
