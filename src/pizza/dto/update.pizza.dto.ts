import { PartialType } from '@nestjs/swagger';
import { CreatePizzaDtoResponse } from './create.pizza.dto';
import { PizzaDto } from './pizza.dto';

export class UpdatePizzaDtoRequest extends PartialType(PizzaDto) {}
export class UpdatePizzaDtoResponse extends CreatePizzaDtoResponse {}
