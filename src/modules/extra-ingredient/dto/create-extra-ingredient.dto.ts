import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateExtraIngredientRequestDto {
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

export class CreateExtraIngredientResponseDto extends CreateExtraIngredientRequestDto {
  @ApiProperty()
  readonly id: number;
}
