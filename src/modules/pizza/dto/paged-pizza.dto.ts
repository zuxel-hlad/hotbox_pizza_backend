import { createPagedSchema, pagedRequestSchema } from '@common/dto/paged.dto';
import { createPizzaResponseSchema } from '@modules/pizza/dto/create-pizza.dto';
import { SortEnum } from '@modules/pizza/pizza.constants';
import { z } from 'zod';

export const pizzaResponseSchema = createPizzaResponseSchema.extend({
  isFavorited: z.boolean(),
});

export const pagedPizzaRequestSchema = pagedRequestSchema.extend({
  searchQuery: z.string().optional(),
  favoritesCount: z
    .enum(SortEnum)
    .optional()
    .meta({ description: 'Sort by favorites count. Available values: ASC/DESC' }),
  price: z.enum(SortEnum).optional().meta({ description: 'Sort by price. Available values: ASC/DESC' }),
  priceMin: z.coerce
    .number()
    .min(1, 'The min price value must be at least 1.')
    .optional()
    .meta({ description: 'Sort by range minPrice/maxPrice.' }),
  priceMax: z.coerce.number().optional().meta({ description: 'Sort by range minPrice/maxPrice.' }),
  calories: z.enum(SortEnum).optional().meta({ description: 'Sort by pizza calories. Available values: ASC/DESC' }),
});

export const pagedPizzaResponseSchema = createPagedSchema(pizzaResponseSchema);

export type PagedPizzaRequestDto = z.infer<typeof pagedPizzaRequestSchema>;
