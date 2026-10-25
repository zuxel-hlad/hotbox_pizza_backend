import { passwordSchema } from '@common/schemas/password.schema';
import { z } from 'zod';

export const changePasswordSchema = z.strictObject({
  oldPassword: passwordSchema,
  newPassword: passwordSchema,
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
