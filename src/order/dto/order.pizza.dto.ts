import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber } from 'class-validator';

export class OrderPizzaDto {
  @IsNumber()
  @ApiProperty()
  readonly pizzaId: number;

  @IsNumber()
  @ApiProperty()
  readonly count: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ApiProperty({ type: [Number] })
  readonly extraIngredientsIds: number[];

  @IsBoolean()
  @ApiProperty()
  readonly cheeseStuffedCrust: boolean;

  @IsBoolean()
  @ApiProperty()
  readonly sausageStuffedCrust: boolean;
}
