import { PizzaEntity } from '../pizza.entity';

export interface PizzaResponse extends PizzaEntity {
  isFavorited: boolean;
}
