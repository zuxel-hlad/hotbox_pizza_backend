import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { PizzaIngredientDto } from './pizza.ingredient.dto';

export class PizzaDto {
  @IsUrl({ require_protocol: true, require_valid_protocol: true, protocols: ['http', 'https'] })
  @Transform(({ value }: { value: string }) => (value === '' ? undefined : value))
  @IsOptional()
  @ApiProperty({ required: false })
  readonly imgUrl: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly nameEn: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly nameUa: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({ type: [PizzaIngredientDto] })
  readonly ingredients: PizzaIngredientDto[];

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly calories: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly price: number;
}
