import { OrderPizzaDto } from '@modules/order/dto/order-pizza.dto';
import { OrderStatus, PaymentType } from '@modules/order/order.constants';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsPhoneNumber, IsString, ValidateNested } from 'class-validator';

export class OrderDto {
  @IsEnum(OrderStatus)
  @ApiProperty({ example: OrderStatus.PENDING })
  readonly status: OrderStatus;

  @IsEnum(PaymentType)
  @ApiProperty({
    example: `${PaymentType.CASH_PAYMENT} / ${PaymentType.BONUS_PAYMENT} / ${PaymentType.ONLINE_PAYMENT}`,
  })
  readonly paymentType: PaymentType;

  @IsArray()
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
