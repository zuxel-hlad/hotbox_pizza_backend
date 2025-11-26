import { validationsSettings } from '@app/common/dto.validation.settings';
import {
  CreatePizzaDtoRequest,
  CreatePizzaDtoResponse,
  PagedPizzaRequestDto,
  PagedPizzaResponseDto,
  PizzaResponseDto,
  UpdatePizzaDtoRequest,
} from '@app/pizza/dto';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { PizzaService } from '@app/pizza/pizza.service';
import { PagedPizzaResponseInterface } from '@app/pizza/types/paged.pizza.response.interface';
import { PizzaResponseInterface } from '@app/pizza/types/pizza.response.interface';
import { User } from '@app/user/decorators/user.decorator';
import { AuthGuard } from '@app/user/guards/auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { DeleteResult } from 'typeorm';

@ApiTags('Pizza resource')
@Controller('pizza')
export class PizzaController {
  constructor(private readonly pizzaService: PizzaService) {}

  @Get('favorite')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.OK, type: PizzaResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, example: { statusCode: HttpStatus.NOT_FOUND, message: 'Not found' } })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' },
  })
  @ApiOperation({ summary: 'Get favorite pizza' })
  async getFavoritePizza(@User('id') userId: number): Promise<PizzaResponseInterface[]> {
    return await this.pizzaService.getFavoritePizza(userId);
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: CreatePizzaDtoResponse })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    example: { statusCode: HttpStatus.NOT_FOUND, message: 'Not found' },
  })
  @ApiOperation({ summary: 'Get single pizza' })
  async getSinglePizza(@Param('id', ParseIntPipe) id: number): Promise<PizzaEntity> {
    return await this.pizzaService.getSinglePizza(id);
  }

  @Get()
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiResponse({ status: HttpStatus.CREATED, type: PagedPizzaResponseDto, isArray: true })
  @ApiOperation({ summary: 'Get pizza paged' })
  async findAll(
    @User('id') userId: number,
    @Query() query: PagedPizzaRequestDto,
  ): Promise<PagedPizzaResponseInterface> {
    return await this.pizzaService.findAll(userId, query);
  }

  @Post('create')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiSecurity('Token')
  @ApiBody({ type: CreatePizzaDtoRequest })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreatePizzaDtoResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized' },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    example: { statusCode: HttpStatus.CONFLICT, message: 'Pizza with "PizzaNameEn" and "PizzaNameUa" already exist.' },
  })
  @ApiOperation({ summary: 'Create new pizza' })
  async create(@Body() createPizzaDto: CreatePizzaDtoRequest): Promise<PizzaEntity> {
    return await this.pizzaService.create(createPizzaDto);
  }

  @Put('update/:id')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiSecurity('Token')
  @ApiBody({ type: UpdatePizzaDtoRequest })
  @ApiResponse({ status: HttpStatus.OK, type: CreatePizzaDtoResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    example: { statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized' },
  })
  @ApiOperation({ summary: 'Update single pizza' })
  async update(@Body() updateDto: UpdatePizzaDtoRequest, @Param('id', ParseIntPipe) id: number): Promise<PizzaEntity> {
    return await this.pizzaService.update(updateDto, id);
  }

  @Delete('delete/:id')
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, example: { statusCode: HttpStatus.NOT_FOUND, message: 'Not found' } })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    example: { statusCode: HttpStatus.BAD_REQUEST, message: 'Validation failed' },
  })
  @ApiOperation({ summary: 'Delete single pizza' })
  async deleteSinglePizza(@Param('id', ParseIntPipe) id: number): Promise<DeleteResult> {
    return await this.pizzaService.deleteSinglePizza(id);
  }

  @Put('toggle/favorite/:id')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiResponse({ status: HttpStatus.OK, type: CreatePizzaDtoResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiOperation({ summary: 'Toggle favorite pizza' })
  async toggleFavorite(
    @User('id', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) pizzaId: number,
  ): Promise<PizzaEntity> {
    return await this.pizzaService.toggleFavorite(userId, pizzaId);
  }
}
