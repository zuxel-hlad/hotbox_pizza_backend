import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class PagedDto {
  @ApiProperty({ default: 1 })
  readonly pageSize: number;

  @ApiProperty()
  readonly totalPages: number;

  @ApiProperty()
  readonly totalElements: number;

  @ApiProperty()
  readonly pageNumber: number;

  @ApiProperty()
  readonly nextPage: boolean;

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
    readonly content: T[];
  }

  return PagedResponseDto;
};
