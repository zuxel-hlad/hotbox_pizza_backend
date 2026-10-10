import { PizzaIngredientDto } from '@modules/pizza/dto/pizza-ingredient.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

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
  @Type(() => PizzaIngredientDto)
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
