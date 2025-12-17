import { createPaginationDto, PagedRequestDto } from '@app/common/dto/paged.dto';
import { OrderStatus, PaymentType } from '@app/order/constants';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { CreateOrderResponseDto } from './create.order.dto';

export class PagedOrdersRequestDto extends PagedRequestDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: string }) => Number(value))
  @ApiProperty({ required: false })
  readonly userId: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: string }) => Number(value))
  @ApiProperty({ required: false })
  readonly orderId: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly username: string;

  @IsOptional()
  @IsPhoneNumber('UA')
  @ApiProperty({ required: false })
  readonly primaryPhone: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  @ApiProperty({
    required: false,
    description: `${OrderStatus.PAID} /  ${OrderStatus.CANCELED} / ${OrderStatus.DONE} / ${OrderStatus.PENDING}`,
  })
  readonly status: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentType)
  @ApiProperty({
    required: false,
    description: `${PaymentType.BONUS_PAYMENT} / ${PaymentType.CASH_PAYMENT} / ${PaymentType.ONLINE_PAYMENT} / ${PaymentType.WAIT_FOR_PAYMENT}`,
  })
  readonly paymentType: PaymentType;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  readonly createdAt: string;
}
export class PagedOrdersResponseDto extends createPaginationDto(CreateOrderResponseDto) {}
