import { phoneSchema } from '@common/schemas/phone.schema';
import { orderPizzaSchema } from '@modules/order/dto/order-pizza.dto';
import { OrderStatus, PaymentType } from '@modules/order/order.constants';
import { z } from 'zod';

export const orderSchema = z.strictObject({
  status: z.enum(OrderStatus).meta({ example: OrderStatus.PENDING }),
  paymentType: z.enum(PaymentType),
  pizzas: z.array(orderPizzaSchema).min(1),
  primaryPhone: phoneSchema,
  username: z.string(),
  comment: z.string().default(''),
});
