import { OrderResponse } from '@app/order/types/order.response';
import { PagedData } from '@app/types';

export interface PagedOrderResponse extends PagedData<OrderResponse[]> {}
