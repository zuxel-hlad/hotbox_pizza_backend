import { CreateExtraIngredientResponseDto } from '@modules/extra-ingredient/dto/create-extra-ingredient.dto';
import { CreatePizzaDtoResponse } from '@modules/pizza/dto/create-pizza.dto';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { ApiProperty } from '@nestjs/swagger';

export class OrderResultPizzaDto {
  @ApiProperty({ type: CreatePizzaDtoResponse })
  readonly pizza: PizzaEntity;

  @ApiProperty({ type: [CreateExtraIngredientResponseDto] })
  readonly extraIngredients: CreateExtraIngredientResponseDto[];

  @ApiProperty()
  readonly count: number;

  @ApiProperty()
  readonly cheeseStuffedCrust: boolean;

  @ApiProperty()
  readonly sausageStuffedCrust: boolean;
}

export class CreateOrderResultDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty({ type: [OrderResultPizzaDto] })
  readonly pizzas: OrderResultPizzaDto[];

  @ApiProperty()
  readonly price: number;
}
