import { isValidPhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

export const phoneSchema = z
  .string()
  .refine((phone) => isValidPhoneNumber(phone), { params: { constraint: 'must be a valid phone number' } });
