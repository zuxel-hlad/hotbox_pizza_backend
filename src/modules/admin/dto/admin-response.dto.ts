import { Role } from '@common/types/role.enum';
import { z } from 'zod';

export const adminResponseSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  email: z.string(),
  role: z.literal(Role.ADMIN),
});
