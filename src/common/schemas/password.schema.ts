import { z } from 'zod';

export const passwordSchema = z.string().min(8, 'Password must be more than 8 characters long.');
