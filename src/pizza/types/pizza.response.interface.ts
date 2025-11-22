import { PizzaEntity } from '../pizza.entity';

export interface PizzaResponseInterface extends PizzaEntity {
  isFavorited: boolean;
}
