import { pizzaSchema } from '@modules/pizza/dto/pizza.dto';
import { z } from 'zod';

export const createPizzaSchema = pizzaSchema;

export const createPizzaResponseSchema = pizzaSchema.extend({
  id: z.number(),
  imgUrl: z.string(),
  favoritesCount: z.number(),
});

export type CreatePizzaDtoRequest = z.infer<typeof createPizzaSchema>;
