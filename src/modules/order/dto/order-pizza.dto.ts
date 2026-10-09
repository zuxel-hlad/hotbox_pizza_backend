import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsInt, Min } from 'class-validator';

export class OrderPizzaDto {
  @IsInt()
  @ApiProperty()
  readonly pizzaId: number;

  @IsInt()
  @Min(1)
  @ApiProperty({ minimum: 1 })
  readonly count: number;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
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
