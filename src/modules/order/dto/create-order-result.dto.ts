import { createExtraIngredientResponseSchema } from '@modules/extra-ingredient/dto/create-extra-ingredient.dto';
import { createPizzaResponseSchema } from '@modules/pizza/dto/create-pizza.dto';
import { z } from 'zod';

const orderResultPizzaSchema = z.object({
  pizza: createPizzaResponseSchema,
  extraIngredients: z.array(createExtraIngredientResponseSchema),
  count: z.number(),
  cheeseStuffedCrust: z.boolean(),
  sausageStuffedCrust: z.boolean(),
});

export const createOrderResultSchema = z.object({
  id: z.number(),
  pizzas: z.array(orderResultPizzaSchema),
  price: z.number(),
});

export type OrderResultPizzaDto = z.infer<typeof orderResultPizzaSchema>;
export type CreateOrderResultDto = z.infer<typeof createOrderResultSchema>;
