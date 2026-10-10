import { PizzaDto } from '@modules/pizza/dto/pizza.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdatePizzaDtoRequest extends PartialType(PizzaDto) {}
