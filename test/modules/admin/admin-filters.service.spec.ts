import { AdminFiltersService } from '@modules/admin/admin-filters.service';
import { AdminEntity } from '@modules/admin/admin.entity';
import { createQueryBuilderMock, QueryBuilderMock } from '@test/helpers/query-builder.mock';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { Repository } from 'typeorm';

describe('AdminFiltersService', () => {
  const admins = [{ id: 2 }, { id: 1 }];
  let adminRepository: RepositoryMock;
  let queryBuilder: QueryBuilderMock;
  let filtersService: AdminFiltersService;

  beforeEach(() => {
    adminRepository = createRepositoryMock();
    queryBuilder = createQueryBuilderMock(admins, 12);
    adminRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    filtersService = new AdminFiltersService(adminRepository as unknown as Repository<AdminEntity>);
  });

  it('pages admins without filters', async () => {
    const result = await filtersService.getFilteredData({ page: 2, pageSize: 5 });

    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(result).toMatchObject({ content: admins, totalElements: 12, totalPages: 3, pageNumber: 2 });
  });

  it('escapes ILIKE wildcards in the search', async () => {
    await filtersService.getFilteredData({ page: 1, pageSize: 10, search: '50%_off' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.any(String), { search: '%50\\%\\_off%' });
  });

  it('filters by fields, search and orders', async () => {
    await filtersService.getFilteredData({
      page: 1,
      pageSize: 10,
      lastName: ' Doe ',
      search: 'jo',
      userId: 3,
      orderId: 7,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('admin.lastName ILIKE :lastName', { lastName: '%Doe%' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.stringContaining('admin.firstName ILIKE :search'), {
      search: '%jo%',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.stringContaining('order_list."userId" = :userId'), {
      userId: 3,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(expect.stringContaining('order_list.id = :orderId'), {
      orderId: 7,
    });
  });
});
