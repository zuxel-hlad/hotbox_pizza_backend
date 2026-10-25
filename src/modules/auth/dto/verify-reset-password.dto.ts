import { passwordSchema } from '@common/schemas/password.schema';
import { z } from 'zod';

export const verifyResetPasswordSchema = z.strictObject({
  email: z.email(),
  code: z.string().min(1),
  password: passwordSchema,
});

export type VerifyResetPasswordDto = z.infer<typeof verifyResetPasswordSchema>;
