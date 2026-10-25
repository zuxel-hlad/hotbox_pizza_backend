import { createPagedSchema, pagedRequestSchema } from '@common/dto/paged.dto';
import { phoneSchema } from '@common/schemas/phone.schema';
import { createOrderResponseSchema } from '@modules/order/dto/create-order.dto';
import { OrderStatus, PaymentType } from '@modules/order/order.constants';
import { z } from 'zod';

export const pagedOrdersRequestSchema = pagedRequestSchema.extend({
  userId: z.coerce.number().optional(),
  orderId: z.coerce.number().optional(),
  username: z.string().optional(),
  primaryPhone: phoneSchema.optional(),
  status: z.enum(OrderStatus).optional(),
  paymentType: z.enum(PaymentType).optional(),
  createdAt: z.iso.date().optional(),
});

export const pagedOrdersResponseSchema = createPagedSchema(createOrderResponseSchema);

export type PagedOrdersRequestDto = z.infer<typeof pagedOrdersRequestSchema>;
