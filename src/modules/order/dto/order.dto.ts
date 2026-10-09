import { OrderPizzaDto } from '@modules/order/dto/order-pizza.dto';
import { OrderStatus, PaymentType } from '@modules/order/order.constants';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsPhoneNumber, IsString, ValidateNested } from 'class-validator';

export class OrderDto {
  @IsEnum(OrderStatus)
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  readonly status: OrderStatus;

  @IsEnum(PaymentType)
  @ApiProperty({ enum: PaymentType })
  readonly paymentType: PaymentType;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderPizzaDto)
  @ApiProperty({ type: [OrderPizzaDto] })
  readonly pizzas: OrderPizzaDto[];

  @IsPhoneNumber('UA')
  @ApiProperty()
  readonly primaryPhone: string;

  @IsString()
  @ApiProperty()
  readonly username: string;

  @IsOptional()
  @ApiProperty({ required: false, default: '' })
  readonly comment: string;
}
