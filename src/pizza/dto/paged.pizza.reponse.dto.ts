import { CreatePizzaDtoResponse } from '@app/pizza/dto/create.pizza.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class PizzaResponseDto extends CreatePizzaDtoResponse {
  @IsBoolean()
  @ApiProperty()
  isFavorited: boolean;
}

export class PagedPizzaRequestDto {
  readonly page: number;
  readonly pageSize: number;
  readonly searchQuery: string;
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

  readonly content: PizzaResponseDto[];
}
