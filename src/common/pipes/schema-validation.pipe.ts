import { validationErrorMap } from '@common/helpers/validation-error-map.helper';
import { ArgumentMetadata, BadRequestException, Injectable, StandardSchemaValidationPipe } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class SchemaValidationPipe extends StandardSchemaValidationPipe {
  constructor() {
    super({ exceptionFactory: (issues) => new BadRequestException(issues.map((issue) => issue.message)) });
  }

  async transform<T>(value: T, metadata: ArgumentMetadata): Promise<T> {
    const isMissingBody = metadata.type === 'body' && value === undefined && Boolean(metadata.schema);

    if (isMissingBody) {
      return super.transform({} as T, metadata);
    }

    return super.transform(value, metadata);
  }

  protected async validate<T>(value: unknown, schema: z.ZodType) {
    const result = await schema.safeParseAsync(value, { error: validationErrorMap });

    if (!result.success) {
      return { issues: result.error.issues };
    }

    return { value: result.data as T };
  }
}
