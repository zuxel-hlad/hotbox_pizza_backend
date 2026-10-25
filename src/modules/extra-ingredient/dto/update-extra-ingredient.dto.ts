import { createExtraIngredientSchema } from '@modules/extra-ingredient/dto/create-extra-ingredient.dto';
import { z } from 'zod';

export const updateExtraIngredientSchema = createExtraIngredientSchema.partial();

export type UpdateExtraIngredientRequestDto = z.infer<typeof updateExtraIngredientSchema>;
