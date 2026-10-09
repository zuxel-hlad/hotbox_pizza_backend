import { PagedData } from '@common/types/paged-data.interface';
import { OrderResponse } from '@modules/order/types/order-response';

export interface PagedOrderResponse extends PagedData<OrderResponse[]> {}
