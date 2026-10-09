import { createPaginationDto, PagedRequestDto } from '@common/dto/paged.dto';
import { plainToInstance } from 'class-transformer';
import { IsString, validate } from 'class-validator';

class ItemDto {
  @IsString()
  readonly name: string;
}

const PagedItemsDto = createPaginationDto(ItemDto);

const pageFields = { pageSize: 10, totalPages: 1, totalElements: 1, pageNumber: 1, nextPage: 0, prevPage: false };

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

describe('createPaginationDto', () => {
  it('accepts valid content items', async () => {
    const dto = plainToInstance(PagedItemsDto, { ...pageFields, content: [{ name: 'Margherita' }] });

    expect(dto.content[0]).toBeInstanceOf(ItemDto);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('validates nested content items', async () => {
    const [error] = await validate(plainToInstance(PagedItemsDto, { ...pageFields, content: [{ name: 1 }] }));

    expect(error.property).toBe('content');
  });
});
