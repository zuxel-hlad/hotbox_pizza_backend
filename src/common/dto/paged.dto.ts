import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, Min, ValidateNested } from 'class-validator';

export class PagedDto {
  @Transform(({ value }: { value: string }) => Number(value))
  @IsNumber()
  @Min(1, { message: 'The page size value must be at least 1.' })
  @ApiProperty({ default: 1 })
  readonly pageSize: number;

  @IsNumber()
  @ApiProperty()
  readonly totalPages: number;

  @IsNumber()
  @ApiProperty()
  readonly totalElements: number;

  @IsNumber()
  @ApiProperty()
  readonly pageNumber: number;

  @IsNumber()
  @ApiProperty()
  readonly nextPage: boolean;

  @IsBoolean()
  @ApiProperty()
  readonly prevPage: boolean;
}

export class PagedRequestDto {
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
}

export const createPaginationDto = <T>(ItemDto: new () => T) => {
  class PagedResponseDto extends PagedDto {
    @ApiProperty({ type: [ItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemDto)
    readonly content: T[];
  }

  return PagedResponseDto;
};
