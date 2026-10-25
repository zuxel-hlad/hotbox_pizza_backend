import { PaymentType } from '@modules/order/order.constants';
import { z } from 'zod';

export const paymentSchema = z.strictObject({
  orderId: z.number(),
  paymentType: z.enum(PaymentType).meta({ example: PaymentType.ONLINE_PAYMENT }),
});

export type PaymentDto = z.infer<typeof paymentSchema>;
