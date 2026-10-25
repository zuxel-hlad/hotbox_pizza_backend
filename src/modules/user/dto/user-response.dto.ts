import { z } from 'zod';

export const userResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    username: z.string(),
    birthDate: z.string(),
    bonuses: z.number(),
    image: z.string(),
    phone: z.string(),
  }),
});

export type UserResponseDto = z.infer<typeof userResponseSchema>;
