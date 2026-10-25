import { z } from 'zod';

export const tokenSchema = z.object({
  token: z.string(),
  expiresIn: z.number(),
});

export const tokenRenewRequestSchema = z.strictObject({
  token: z.jwt(),
});

export const tokenResponseSchema = z.object({
  access: tokenSchema,
  refresh: tokenSchema,
});

export type TokenRenewRequestDto = z.infer<typeof tokenRenewRequestSchema>;
