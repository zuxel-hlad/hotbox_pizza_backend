import { PizzaResponseInterface } from '@app/pizza/types/pizza.response.interface';
import { PagedData } from '@app/types';

export interface PagedPizzaResponseInterface extends PagedData<PizzaResponseInterface[]> {}
