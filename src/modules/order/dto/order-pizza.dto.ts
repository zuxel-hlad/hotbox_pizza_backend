import { z } from 'zod';

export const orderPizzaSchema = z.strictObject({
  pizzaId: z.number().int(),
  count: z.number().int().min(1),
  extraIngredientsIds: z
    .array(z.number().int())
    .refine((ids) => new Set(ids).size === ids.length, { params: { constraint: 'elements must be unique' } }),
  cheeseStuffedCrust: z.boolean(),
  sausageStuffedCrust: z.boolean(),
});

export type OrderPizzaDto = z.infer<typeof orderPizzaSchema>;
