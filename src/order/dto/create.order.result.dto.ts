import { CreateExtraIngredientResponseDto } from '@app/extra-ingredient/dto';
import { CreatePizzaDtoResponse } from '@app/pizza/dto';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, ValidateNested } from 'class-validator';

export class OrderResultPizzaDto {
  @ApiProperty({ type: CreatePizzaDtoResponse })
  readonly pizza: PizzaEntity;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExtraIngredientResponseDto)
  @ApiProperty({ type: [CreateExtraIngredientResponseDto] })
  readonly extraIngredients: CreateExtraIngredientResponseDto[];

  @IsNumber()
  @ApiProperty()
  readonly count: number;

  @IsBoolean()
  @ApiProperty()
  readonly cheeseStuffedCrust: boolean;

  @IsBoolean()
  @ApiProperty()
  readonly sausageStuffedCrust: boolean;
}

export class CreateOrderResultDto {
  @IsNumber()
  @ApiProperty()
  readonly id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderResultPizzaDto)
  @ApiProperty({ type: [OrderResultPizzaDto] })
  readonly pizzas: OrderResultPizzaDto[];

  @IsNumber()
  @ApiProperty()
  readonly price: number;
}
