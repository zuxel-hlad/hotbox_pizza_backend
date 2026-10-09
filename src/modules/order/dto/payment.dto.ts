import { PaymentType } from '@modules/order/order.constants';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';

export class PaymentDto {
  @IsNumber()
  @ApiProperty()
  readonly orderId: number;

  @IsEnum(PaymentType)
  @ApiProperty({ example: PaymentType.ONLINE_PAYMENT })
  readonly paymentType: PaymentType;
}
