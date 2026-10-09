import { ExtraIngredientEntity } from '@modules/extra-ingredient/extra-ingredient.entity';
import { PizzaEntity } from '@modules/pizza/pizza.entity';

export interface OrderResult {
  id: number;
  pizzas: OrderResultPizza[];
  price: number;
}

export interface OrderResultPizza {
  pizza: PizzaEntity;
  extraIngredients: ExtraIngredientEntity[];
  count: number;
  cheeseStuffedCrust: boolean;
  sausageStuffedCrust: boolean;
}
