import { PizzaResponse } from '@app/pizza/types/pizza.response.interface';
import { PagedData } from '@app/types';

export interface PagedPizzaResponse extends PagedData<PizzaResponse[]> {}
