import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ExtraIngredientDto {
  @ApiProperty()
  @IsString()
  readonly nameEn: string;

  @ApiProperty()
  @IsString()
  readonly nameUa: string;

  @ApiProperty()
  @IsNumber()
  readonly calories: number;

  @ApiProperty()
  @IsNumber()
  readonly price: number;
}

export class CreateExtraIngredientRequestDto extends ExtraIngredientDto {}

export class CreateExtraIngredientResponseDto extends ExtraIngredientDto {
  @ApiProperty()
  readonly id: number;
}
