import { SortEnum } from '@app/pizza/constants';
import { CreatePizzaDtoResponse } from '@app/pizza/dto/create.pizza.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class PizzaResponseDto extends CreatePizzaDtoResponse {
  @IsBoolean()
  @ApiProperty()
  isFavorited: boolean;
}

export class PagedPizzaRequestDto {
  @Transform(({ value }: { value: string }) => Number(value))
  @IsNumber()
  @Min(1, { message: 'The page value must be at least 1.' })
  @ApiProperty({ default: 1 })
  readonly page: number;

  @Transform(({ value }: { value: string }) => Number(value))
  @IsNumber()
  @Min(1, { message: 'The page size value must be at least 1.' })
  @ApiProperty({ default: 1 })
  readonly pageSize: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly searchQuery: string;

  @IsOptional()
  @IsEnum(SortEnum)
  @ApiProperty({ required: false, description: 'Sort by favorites count. Available values: ASC/DESC' })
  readonly favoritesCount: SortEnum;

  @IsOptional()
  @IsEnum(SortEnum)
  @ApiProperty({ required: false, description: 'Sort by price. Available values: ASC/DESC' })
  readonly price: SortEnum;

  @Transform(({ value }: { value: string }) => Number(value))
  @IsOptional()
  @Min(1, { message: 'The min price value must be at least 1.' })
  @ApiProperty({ required: false, description: 'Sort by range minPrice/maxPrice.' })
  readonly priceMin: number;

  @Transform(({ value }: { value: string }) => Number(value))
  @IsOptional()
  @ApiProperty({ required: false, description: 'Sort by range minPrice/maxPrice.' })
  readonly priceMax: number;

  @IsOptional()
  @IsEnum(SortEnum)
  @ApiProperty({ required: false, description: 'Sort by pizza calories. Available values: ASC/DESC' })
  readonly calories: SortEnum;
}

export class PagedPizzaResponseDto {
  @IsNumber()
  @ApiProperty()
  readonly totalPages: number;

  @IsNumber()
  @ApiProperty()
  readonly totalElements: number;

  @IsNumber()
  @ApiProperty()
  readonly pageSize: number;

  @IsNumber()
  @ApiProperty()
  readonly pageNumber: number;

  @IsNumber()
  @ApiProperty()
  readonly nextPage: boolean;

  @IsBoolean()
  @ApiProperty()
  readonly prevPage: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PizzaResponseDto)
  @ApiProperty({ type: [PizzaResponseDto] })
  readonly content: PizzaResponseDto[];
}
