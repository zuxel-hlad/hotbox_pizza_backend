import { PizzaEntity } from '@modules/pizza/pizza.entity';

export interface PizzaResponse extends PizzaEntity {
  isFavorited: boolean;
}
