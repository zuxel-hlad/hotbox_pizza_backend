import { passwordSchema } from '@common/schemas/password.schema';
import { z } from 'zod';

export const loginSchema = z.strictObject({
  email: z.email(),
  password: passwordSchema,
});

export type LoginDto = z.infer<typeof loginSchema>;
