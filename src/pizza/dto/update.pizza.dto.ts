import { PizzaDto } from '@app/pizza/dto/pizza.dto';
import { PartialType } from '@nestjs/swagger';
import { CreatePizzaDtoResponse } from './create.pizza.dto';

export class UpdatePizzaDtoRequest extends PartialType(PizzaDto) {}
export class UpdatePizzaDtoResponse extends CreatePizzaDtoResponse {}
