import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PizzaIngredientDto {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false })
  readonly id: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly nameEn: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly nameUa: string;
}

export class PizzaIngredientResponseDto extends PizzaIngredientDto {}
