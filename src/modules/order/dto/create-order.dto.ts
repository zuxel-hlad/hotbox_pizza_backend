import { orderSchema } from '@modules/order/dto/order.dto';
import { z } from 'zod';

export const createOrderSchema = orderSchema.extend({
  userId: z.number().int().optional(),
});

export const createOrderResponseSchema = orderSchema.extend({
  id: z.number(),
  price: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  userId: z.number().nullable(),
  adminId: z.number().nullable(),
});

export type CreateOrderRequestDto = z.infer<typeof createOrderSchema>;
