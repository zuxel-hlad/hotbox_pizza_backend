import { Admin } from '@common/decorators/admin.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { User } from '@common/decorators/user.decorator';
import { Role } from '@common/types/role.enum';
import { AuthGuard } from '@core/guards/auth.guard';
import { type CreateOrderResultDto, createOrderResultSchema } from '@modules/order/dto/create-order-result.dto';
import {
  type CreateOrderRequestDto,
  createOrderResponseSchema,
  createOrderSchema,
} from '@modules/order/dto/create-order.dto';
import {
  type PagedOrdersRequestDto,
  pagedOrdersRequestSchema,
  pagedOrdersResponseSchema,
} from '@modules/order/dto/paged-orders.dto';
import { type PaymentDto, paymentSchema } from '@modules/order/dto/payment.dto';
import { type UpdateOrderRequestDto, updateOrderSchema } from '@modules/order/dto/update-order.dto';
import { OrderService } from '@modules/order/order.service';
import { OrderResponse } from '@modules/order/types/order-response';
import { PagedOrderResponse } from '@modules/order/types/paged-order-response';
import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Order resource')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('list')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: pagedOrdersResponseSchema })
  @ApiOperation({ summary: 'Get orders paged' })
  async findAll(
    @Query({ schema: pagedOrdersRequestSchema }) query: PagedOrdersRequestDto,
  ): Promise<PagedOrderResponse> {
    return await this.orderService.findAll(query);
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: createOrderResponseSchema })
  @ApiResponse({ example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Order not found' } })
  @ApiOperation({ summary: 'Find order by id' })
  async findById(@Param('id', ParseIntPipe) orderId: number): Promise<OrderResponse> {
    return await this.orderService.findById(orderId);
  }

  @Get('result/:id')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: createOrderResultSchema })
  @ApiResponse({ example: { statusCode: HttpStatus.NOT_FOUND, message: 'Order not found' } })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    example: { statusCode: HttpStatus.BAD_REQUEST, message: 'Pizza 1 not found' },
  })
  @ApiOperation({ summary: 'Get order result' })
  async getOrderResult(@Param('id', ParseIntPipe) orderId: number): Promise<CreateOrderResultDto> {
    return await this.orderService.buildCreateOrderResult(orderId);
  }

  @Post('create')
  @ApiResponse({ status: HttpStatus.CREATED, standardSchema: createOrderResponseSchema })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    example: { statusCode: HttpStatus.BAD_REQUEST, message: 'Pizza cannot have both cheese and sausage stuffed crust' },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized' },
  })
  @ApiOperation({ summary: 'Create new order' })
  async create(
    @Body({ schema: createOrderSchema }) newOrder: CreateOrderRequestDto,
    @User('id') userId?: number,
    @Admin('id') adminId?: number,
  ): Promise<OrderResponse> {
    return await this.orderService.create(newOrder, userId, adminId);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard)
  @Roles([Role.ADMIN])
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: createOrderResponseSchema })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    example: { statusCode: HttpStatus.NOT_FOUND, message: 'Order not found' },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    example: { statusCode: HttpStatus.BAD_REQUEST, message: 'Order already paid. Pizzas cannot be changed' },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized.' },
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, example: { statusCode: HttpStatus.FORBIDDEN, message: 'Forbidden.' } })
  @ApiOperation({ summary: 'Update order' })
  async update(
    @Param('id', ParseIntPipe) orderId: number,
    @Body({ schema: updateOrderSchema }) updateOrderDto: UpdateOrderRequestDto,
  ): Promise<OrderResponse> {
    return await this.orderService.update(orderId, updateOrderDto);
  }

  @Post('payment')
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    example: { statusCode: HttpStatus.BAD_REQUEST, message: 'Payment failed. Order not found' },
  })
  @ApiOperation({ summary: 'Pay order' })
  async payOrder(@Body({ schema: paymentSchema }) paymentDto: PaymentDto): Promise<void> {
    return await this.orderService.payOrder(paymentDto);
  }
}
