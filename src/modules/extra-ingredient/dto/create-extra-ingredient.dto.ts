import { z } from 'zod';

export const createExtraIngredientSchema = z.strictObject({
  nameEn: z.string(),
  nameUa: z.string(),
  calories: z.number(),
  price: z.number(),
});

export const createExtraIngredientResponseSchema = createExtraIngredientSchema.extend({
  id: z.number(),
});

export type CreateExtraIngredientRequestDto = z.infer<typeof createExtraIngredientSchema>;
