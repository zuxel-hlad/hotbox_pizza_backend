import { PagedData } from '@common/types/paged-data.interface';
import { PizzaResponse } from '@modules/pizza/types/pizza-response.interface';

export interface PagedPizzaResponse extends PagedData<PizzaResponse[]> {}
