import { validationsSettings } from '@app/common/dto.validation.settings';
import {
  CreateOrderRequestDto,
  CreateOrderResponseDto,
  CreateOrderResultDto,
  PagedOrdersRequestDto,
  PagedOrdersResponseDto,
  PaymentDto,
} from '@app/order/dto';
import { OrderService } from '@app/order/order.service';
import { OrderResponse } from '@app/order/types/order.response';
import { PagedOrderResponse } from '@app/order/types/pages.order.response';
import { User } from '@app/user/decorators/user.decorator';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Order resource')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('list')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiResponse({ status: HttpStatus.OK, type: PagedOrdersResponseDto, isArray: true })
  @ApiOperation({ summary: 'Get orders paged' })
  async findAll(@Query() query: PagedOrdersRequestDto): Promise<PagedOrderResponse> {
    return await this.orderService.findAll(query);
  }

  @Get(':id')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiResponse({ status: HttpStatus.OK, type: CreateOrderResponseDto })
  @ApiResponse({ example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Order not found' } })
  @ApiOperation({ summary: 'Find order by id' })
  async findById(@Param('id', ParseIntPipe) orderId: number): Promise<OrderResponse> {
    return await this.orderService.findById(orderId);
  }

  @Get('result/:id')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiResponse({ status: HttpStatus.OK, type: CreateOrderResultDto })
  @ApiResponse({ example: { statusCode: HttpStatus.NOT_FOUND, message: 'Order not found' } })
  @ApiOperation({ summary: 'Get order result' })
  async getOrderResult(@Param('id', ParseIntPipe) orderId: number): Promise<CreateOrderResultDto> {
    return await this.orderService.buildCreateOrderResult(orderId);
  }

  @Post('create')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiBody({ type: CreateOrderRequestDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateOrderResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized' },
  })
  @ApiOperation({ summary: 'Create new order' })
  async create(@Body() newOrder: CreateOrderRequestDto, @User('id') userId?: number): Promise<OrderResponse> {
    return await this.orderService.create(newOrder, userId);
  }

  @Post('payment')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiBody({ type: PaymentDto })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    example: { statusCode: HttpStatus.BAD_REQUEST, message: 'Payment failed. Order not found' },
  })
  @ApiOperation({ summary: 'Pay order' })
  async payOrder(@Body() paymentDto: PaymentDto): Promise<void> {
    return await this.orderService.payOrder(paymentDto);
  }
}
