import { OrderDto } from '@app/order/dto/order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsOptional } from 'class-validator';

export class CreateOrderRequestDto extends OrderDto {}
export class CreateOrderResponseDto extends OrderDto {
  @IsNumber()
  @ApiProperty()
  readonly id: number;

  @IsDate()
  @ApiProperty()
  readonly createdAt: Date;

  @IsDate()
  @ApiProperty()
  readonly updatedAt: Date;

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  readonly userId: number | null;
}
