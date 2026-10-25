import { z } from 'zod';

export const resetPasswordSchema = z.strictObject({
  email: z.email(),
});

export const resetPasswordResponseSchema = z.object({
  message: z.string().meta({ example: 'Reset password code sent to st**********n@gmail.com' }),
  statusCode: z.number().meta({ example: 200 }),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
