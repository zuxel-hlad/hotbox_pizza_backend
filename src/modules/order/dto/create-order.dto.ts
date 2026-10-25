import { orderSchema } from '@modules/order/dto/order.dto';
import { z } from 'zod';

export const createOrderSchema = orderSchema;

export const createOrderResponseSchema = orderSchema.extend({
  id: z.number(),
  price: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  userId: z.number().nullable(),
});

export type CreateOrderRequestDto = z.infer<typeof createOrderSchema>;
