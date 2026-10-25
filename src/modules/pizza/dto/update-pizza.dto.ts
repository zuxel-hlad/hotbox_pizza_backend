import { pizzaSchema } from '@modules/pizza/dto/pizza.dto';
import { z } from 'zod';

export const updatePizzaSchema = pizzaSchema.partial();

export type UpdatePizzaDtoRequest = z.infer<typeof updatePizzaSchema>;
