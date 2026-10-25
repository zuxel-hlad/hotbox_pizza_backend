import { passwordSchema } from '@common/schemas/password.schema';
import { Role } from '@common/types/role.enum';
import { adminSchema } from '@modules/admin/dto/admin.dto';
import { z } from 'zod';

const clientRegisterSchema = z.strictObject({
  role: z.literal(Role.CLIENT),
  email: z.email(),
  username: z.string().min(1),
  password: passwordSchema,
});

const adminRegisterSchema = adminSchema.extend({ role: z.literal(Role.ADMIN) });

export const registerSchema = z.discriminatedUnion('role', [clientRegisterSchema, adminRegisterSchema], {
  error: `role must be one of the following values: ${Object.values(Role).join(', ')}`,
});

export type RegisterDto = z.infer<typeof registerSchema>;
