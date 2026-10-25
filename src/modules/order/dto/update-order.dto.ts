import { orderSchema } from '@modules/order/dto/order.dto';
import { z } from 'zod';

export const updateOrderSchema = orderSchema.extend({ comment: z.string() }).partial();

export type UpdateOrderRequestDto = z.infer<typeof updateOrderSchema>;
