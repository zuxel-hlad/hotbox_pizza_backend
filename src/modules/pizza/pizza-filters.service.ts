import { toPagedData } from '@common/helpers/paged.helper';
import { PagedData } from '@common/types/paged-data.interface';
import { PagedPizzaRequestDto } from '@modules/pizza/dto/paged-pizza.dto';
import { SortEnum } from '@modules/pizza/pizza.constants';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PizzaFiltersService {
  constructor(private dataSource: DataSource) {}

  async getFilteredData(query: PagedPizzaRequestDto): Promise<PagedData<PizzaEntity[]>> {
    const { searchQuery, price, priceMax, priceMin, favoritesCount, calories, page, pageSize } = query;

    const filterOptions: Record<string, SortEnum> = {};
    const normalizedSearchQuery = searchQuery?.trim().replace(/\s+/g, '%');
    const search = normalizedSearchQuery ? `%${normalizedSearchQuery}%` : '%%';

    const baseQuery = this.dataSource
      .getRepository(PizzaEntity)
      .createQueryBuilder('pizza')
      .where('(pizza.nameUa ILIKE :search OR pizza.nameEn ILIKE :search)', { search });

    if (priceMin && priceMax) {
      baseQuery.andWhere('pizza.price BETWEEN :priceMin AND :priceMax', { priceMin, priceMax });
    }

    if (price) {
      filterOptions['pizza.price'] = price;
    }

    if (calories) {
      filterOptions['pizza.calories'] = calories;
    }

    if (favoritesCount) {
      filterOptions['pizza.favoritesCount'] = favoritesCount;
    }

    const pizzasCount = await baseQuery.getCount();

    const pizzas = await baseQuery
      .clone()
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(filterOptions)
      .getMany();

    return toPagedData(pizzas, pizzasCount, page, pageSize);
  }
}
