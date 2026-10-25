import { pagedRequestSchema } from '@common/dto/paged.dto';
import { SchemaValidationPipe } from '@common/pipes/schema-validation.pipe';
import { BadRequestException } from '@nestjs/common';

describe('pagedRequestSchema', () => {
  const pipe = new SchemaValidationPipe();
  const validate = (value: unknown) => pipe.transform(value, { type: 'query', schema: pagedRequestSchema });

  it('converts query strings to numbers', async () => {
    await expect(validate({ page: '2', pageSize: '10' })).resolves.toEqual({ page: 2, pageSize: 10 });
  });

  it('rejects a page below 1', async () => {
    await expect(validate({ page: '0', pageSize: '10' })).rejects.toMatchObject({
      response: { message: ['The page value must be at least 1.'] },
    });
  });

  it('rejects a non-numeric page size', async () => {
    await expect(validate({ page: '1', pageSize: 'abc' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(validate({ page: '1', pageSize: 'abc' })).rejects.toMatchObject({
      response: { message: ['pageSize must be a number'] },
    });
  });
});
