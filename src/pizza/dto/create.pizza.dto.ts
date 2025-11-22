import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { PizzaDto } from './pizza.dto';

export class CreatePizzaDtoRequest extends PizzaDto {}
export class CreatePizzaDtoResponse extends PizzaDto {
  @ApiProperty()
  @IsNumber()
  readonly favoritesCount: number;
}
