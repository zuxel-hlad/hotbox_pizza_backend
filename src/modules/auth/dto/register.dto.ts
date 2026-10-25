import { passwordSchema } from '@common/schemas/password.schema';
import { z } from 'zod';

export const registerSchema = z.strictObject({
  email: z.email(),
  username: z.string().min(1),
  password: passwordSchema,
});

export type RegisterDto = z.infer<typeof registerSchema>;
