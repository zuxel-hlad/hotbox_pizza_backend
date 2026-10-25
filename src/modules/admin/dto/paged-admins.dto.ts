import { createPagedSchema, pagedRequestSchema } from '@common/dto/paged.dto';
import { adminResponseSchema } from '@modules/admin/dto/admin-response.dto';
import { z } from 'zod';

export const pagedAdminsRequestSchema = pagedRequestSchema.extend({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  search: z.string().optional(),
  userId: z.coerce.number().optional(),
  orderId: z.coerce.number().optional(),
});

export const pagedAdminsResponseSchema = createPagedSchema(adminResponseSchema);

export type PagedAdminsRequestDto = z.infer<typeof pagedAdminsRequestSchema>;
