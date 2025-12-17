import { createPaginationDto, PagedRequestDto } from '@app/common/dto/paged.dto';
import { SortEnum } from '@app/pizza/constants';
import { CreatePizzaDtoResponse } from '@app/pizza/dto/create.pizza.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, Min } from 'class-validator';

export class PizzaResponseDto extends CreatePizzaDtoResponse {
  @IsBoolean()
  @ApiProperty()
  isFavorited: boolean;
}

export class PagedPizzaRequestDto extends PagedRequestDto {
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

export class PagedPizzaResponseDto extends createPaginationDto(PagedPizzaRequestDto) {}
