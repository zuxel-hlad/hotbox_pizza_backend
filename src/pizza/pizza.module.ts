import { PizzaController } from '@app/pizza/pizza.controller';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { PizzaService } from '@app/pizza/pizza.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([PizzaEntity])],
  controllers: [PizzaController],
  providers: [PizzaService],
})
export class PizzaModule {}
