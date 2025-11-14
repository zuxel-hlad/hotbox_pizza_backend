import { Injectable } from '@nestjs/common';

@Injectable()
export class PizzaService {
  create(): string {
    return 'Hello new Pizza';
  }
}
