import { PizzaFiltersService } from '@modules/pizza/pizza-filters.service';
import { PizzaController } from '@modules/pizza/pizza.controller';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { PizzaService } from '@modules/pizza/pizza.service';
import { UserEntity } from '@modules/user/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([PizzaEntity, UserEntity])],
  controllers: [PizzaController],
  providers: [PizzaService, PizzaFiltersService],
})
export class PizzaModule {}
