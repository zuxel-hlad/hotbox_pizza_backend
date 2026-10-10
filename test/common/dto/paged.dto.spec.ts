import { PagedRequestDto } from '@common/dto/paged.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('PagedRequestDto', () => {
  it('converts query strings to numbers', async () => {
    const dto = plainToInstance(PagedRequestDto, { page: '2', pageSize: '10' });

    expect(dto).toMatchObject({ page: 2, pageSize: 10 });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a page below 1', async () => {
    const [error] = await validate(plainToInstance(PagedRequestDto, { page: '0', pageSize: '10' }));

    expect(error.constraints).toEqual({ min: 'The page value must be at least 1.' });
  });

  it('rejects a non-numeric page size', async () => {
    const [error] = await validate(plainToInstance(PagedRequestDto, { page: '1', pageSize: 'abc' }));

    expect(error.property).toBe('pageSize');
  });
});
