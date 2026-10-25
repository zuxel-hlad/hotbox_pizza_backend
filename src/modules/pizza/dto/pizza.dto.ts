import { emptyAsUndefined } from '@common/schemas/empty-as-undefined.schema';
import { httpUrlSchema } from '@common/schemas/url.schema';
import { pizzaIngredientSchema } from '@modules/pizza/dto/pizza-ingredient.dto';
import { z } from 'zod';

export const pizzaSchema = z.strictObject({
  imgUrl: emptyAsUndefined(httpUrlSchema),
  nameEn: z.string().min(1),
  nameUa: z.string().min(1),
  ingredients: z.array(pizzaIngredientSchema),
  calories: z.number(),
  price: z.number(),
});
