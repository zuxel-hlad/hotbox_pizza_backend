import { PagedPizzaRequestDto } from '@modules/pizza/dto/paged-pizza.dto';
import { PizzaFiltersService } from '@modules/pizza/pizza-filters.service';
import { SortEnum } from '@modules/pizza/pizza.constants';
import { createQueryBuilderMock, QueryBuilderMock } from '@test/helpers/query-builder.mock';
import { DataSource } from 'typeorm';

describe('PizzaFiltersService', () => {
  let queryBuilder: QueryBuilderMock;
  let pizzaFiltersService: PizzaFiltersService;

  const getFilteredData = (query: Partial<PagedPizzaRequestDto>) =>
    pizzaFiltersService.getFilteredData({ page: 1, pageSize: 10, ...query } as PagedPizzaRequestDto);

  const getSearchParameter = (): string => {
    const [, parameters] = queryBuilder.where.mock.calls[0] as [string, { search: string }];

    return parameters.search;
  };

  beforeEach(() => {
    queryBuilder = createQueryBuilderMock([{ id: 1 }], 12);
    const dataSource = { getRepository: () => ({ createQueryBuilder: () => queryBuilder }) };
    pizzaFiltersService = new PizzaFiltersService(dataSource as unknown as DataSource);
  });

  it.each([
    [undefined, '%%'],
    ['  Маргарита  Пепероні ', '%Маргарита%Пепероні%'],
  ])('normalizes the search query %p', async (searchQuery, search) => {
    await getFilteredData({ searchQuery });

    expect(getSearchParameter()).toBe(search);
  });

  it('filters by a price range only when both bounds are set', async () => {
    await getFilteredData({ priceMin: 100 });
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();

    await getFilteredData({ priceMin: 100, priceMax: 300 });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('pizza.price BETWEEN :priceMin AND :priceMax', {
      priceMin: 100,
      priceMax: 300,
    });
  });

  it('sorts by the requested columns', async () => {
    await getFilteredData({ price: SortEnum.ASC, calories: SortEnum.DESC, favoritesCount: SortEnum.ASC });

    expect(queryBuilder.orderBy).toHaveBeenCalledWith({
      'pizza.price': 'ASC',
      'pizza.calories': 'DESC',
      'pizza.favoritesCount': 'ASC',
    });
  });

  it('pages the result', async () => {
    const result = await getFilteredData({ page: 2, pageSize: 5 });

    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(result).toEqual({
      totalPages: 3,
      totalElements: 12,
      pageSize: 5,
      pageNumber: 2,
      nextPage: true,
      prevPage: true,
      content: [{ id: 1 }],
    });
  });
});
