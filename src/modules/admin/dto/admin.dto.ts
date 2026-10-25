import { passwordSchema } from '@common/schemas/password.schema';
import { phoneSchema } from '@common/schemas/phone.schema';
import { z } from 'zod';

export const adminSchema = z.strictObject({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: phoneSchema,
  email: z.email(),
  password: passwordSchema,
});
