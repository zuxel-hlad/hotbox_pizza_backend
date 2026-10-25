import { adminSchema } from '@modules/admin/dto/admin.dto';
import { z } from 'zod';

export const updateAdminSchema = adminSchema.omit({ password: true });

export type UpdateAdminRequestDto = z.infer<typeof updateAdminSchema>;
