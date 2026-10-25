import { Role } from '@common/types/role.enum';
import { adminResponseSchema } from '@modules/admin/dto/admin-response.dto';
import { z } from 'zod';

const clientResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  birthDate: z.string(),
  bonuses: z.number(),
  image: z.string(),
  phone: z.string(),
  role: z.literal(Role.CLIENT),
});

export const userResponseSchema = z.object({
  user: z.union([clientResponseSchema, adminResponseSchema]),
});

export type UserResponseDto = z.infer<typeof userResponseSchema>;
