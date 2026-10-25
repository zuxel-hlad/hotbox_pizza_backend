import { emptyAsUndefined } from '@common/schemas/empty-as-undefined.schema';
import { phoneSchema } from '@common/schemas/phone.schema';
import { httpUrlSchema } from '@common/schemas/url.schema';
import { z } from 'zod';

export const updateUserSchema = z.strictObject({
  email: z.email().optional(),
  username: z.string().optional(),
  birthDate: emptyAsUndefined(z.union([z.iso.date(), z.iso.datetime({ offset: true })])),
  image: emptyAsUndefined(httpUrlSchema),
  phone: emptyAsUndefined(phoneSchema),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
