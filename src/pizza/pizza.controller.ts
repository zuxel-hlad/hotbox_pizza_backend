import { PizzaService } from '@app/pizza/pizza.service';
import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Pizza resource')
@Controller('pizza')
export class PizzaController {
  constructor(private readonly pizzaService: PizzaService) {}
  @Post('create')
  create(): string {
    return this.pizzaService.create();
  }
}
