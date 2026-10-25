import { z } from 'zod';

const pagedSchema = z.object({
  pageSize: z.number(),
  totalPages: z.number(),
  totalElements: z.number(),
  pageNumber: z.number(),
  nextPage: z.boolean(),
  prevPage: z.boolean(),
});

export const pagedRequestSchema = z.strictObject({
  page: z.coerce.number().min(1, 'The page value must be at least 1.'),
  pageSize: z.coerce.number().min(1, 'The page size value must be at least 1.'),
});

export const createPagedSchema = <T extends z.ZodType>(itemSchema: T) =>
  pagedSchema.extend({ content: z.array(itemSchema) });
