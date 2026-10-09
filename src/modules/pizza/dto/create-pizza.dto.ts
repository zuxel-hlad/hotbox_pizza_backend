import { PizzaDto } from '@modules/pizza/dto/pizza.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreatePizzaDtoRequest extends PizzaDto {}
export class CreatePizzaDtoResponse extends PizzaDto {
  @ApiProperty()
  @IsNumber()
  readonly favoritesCount: number;
}
