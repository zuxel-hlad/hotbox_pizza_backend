import { PagedOrdersRequestDto } from '@app/order/dto';
import { OrderEntity } from '@app/order/order.entity';
import { OrderResponse } from '@app/order/types/order.response';
import { PagedData } from '@app/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class OrderFilterService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async getFilteredData(query: PagedOrdersRequestDto): Promise<PagedData<OrderResponse[]>> {
    const { page, pageSize, orderId, createdAt, ...rest } = query;
    const where: FindOptionsWhere<OrderEntity> | FindOptionsWhere<OrderEntity>[] = { id: orderId, ...rest };

    if (createdAt) {
      const start = new Date(`${createdAt}T00:00:00.000Z`);
      const end = new Date(`${createdAt}T23:59:59.999Z`);

      where.createdAt = Between(start, end);
    }

    const [content, totalElements] = await this.orderRepository.findAndCount({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(totalElements / pageSize);
    const pageNumber = page;
    const prevPage = page > 1;
    const nextPage = page < totalPages;

    return {
      totalPages,
      totalElements,
      pageSize,
      pageNumber,
      nextPage,
      prevPage,
      content,
    };
  }
}
