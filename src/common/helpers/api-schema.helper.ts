import { SchemaObject } from '@nestjs/swagger';
import { z } from 'zod';

export const toApiSchema = (schema: z.ZodType): SchemaObject =>
  z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input' }) as SchemaObject;
