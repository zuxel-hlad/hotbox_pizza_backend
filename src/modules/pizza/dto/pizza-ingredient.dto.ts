import { z } from 'zod';

export const pizzaIngredientSchema = z.strictObject({
  id: z.number().optional(),
  nameEn: z.string().min(1),
  nameUa: z.string().min(1),
});
