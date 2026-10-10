import { PizzaDto } from '@modules/pizza/dto/pizza.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePizzaDtoRequest extends PizzaDto {}
export class CreatePizzaDtoResponse extends PizzaDto {
  @ApiProperty()
  readonly favoritesCount: number;
}
