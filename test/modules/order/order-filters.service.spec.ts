import { PagedOrdersRequestDto } from '@modules/order/dto/paged-orders.dto';
import { OrderFilterService } from '@modules/order/order-filters.service';
import { OrderEntity } from '@modules/order/order.entity';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { Between, Repository } from 'typeorm';

describe('OrderFilterService', () => {
  let orderRepository: RepositoryMock;
  let orderFilterService: OrderFilterService;

  beforeEach(() => {
    orderRepository = createRepositoryMock();
    orderFilterService = new OrderFilterService(orderRepository as unknown as Repository<OrderEntity>);
  });

  it('builds the filters and pages the result', async () => {
    orderRepository.findAndCount.mockResolvedValue([[{ id: 5 }], 25]);

    const result = await orderFilterService.getFilteredData({
      page: 2,
      pageSize: 10,
      orderId: 5,
      username: 'john',
      createdAt: '2026-10-09',
    } as PagedOrdersRequestDto);

    expect(orderRepository.findAndCount).toHaveBeenCalledWith({
      where: {
        id: 5,
        username: 'john',
        createdAt: Between(new Date('2026-10-09T00:00:00.000Z'), new Date('2026-10-09T23:59:59.999Z')),
      },
      take: 10,
      skip: 10,
      order: { createdAt: 'DESC' },
    });
    expect(result).toEqual({
      totalPages: 3,
      totalElements: 25,
      pageSize: 10,
      pageNumber: 2,
      nextPage: true,
      prevPage: true,
      content: [{ id: 5 }],
    });
  });

  it('returns an empty first page', async () => {
    orderRepository.findAndCount.mockResolvedValue([[], 0]);

    await expect(
      orderFilterService.getFilteredData({ page: 1, pageSize: 10 } as PagedOrdersRequestDto),
    ).resolves.toMatchObject({ totalPages: 0, nextPage: false, prevPage: false, content: [] });
  });
});
