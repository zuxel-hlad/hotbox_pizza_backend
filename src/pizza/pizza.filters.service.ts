import { SortEnum } from '@app/pizza/constants';
import { PagedPizzaRequestDto } from '@app/pizza/dto';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { PagedData } from '@app/types';
import { Injectable } from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';

@Injectable()
export class PizzaFiltersService {
  constructor(private dataSource: DataSource) {}

  async getFilteredData(query: PagedPizzaRequestDto): Promise<PagedData<PizzaEntity[]>> {
    const { searchQuery, page, pageSize, price, priceMax, priceMin, favoritesCount, calories } = query;

    const filterOptions: Record<string, SortEnum> = {};
    const search = searchQuery ? `%${searchQuery.toLowerCase()}%` : '%%';

    const baseQuery = this.dataSource
      .getRepository(PizzaEntity)
      .createQueryBuilder('pizza')
      .where(
        new Brackets((qb) => {
          qb.where('pizza.nameUa ILIKE :search', { search }).orWhere('pizza.nameEn ILIKE :search', { search });
        }),
      );

    if (priceMin && priceMax) {
      baseQuery.andWhere('pizza.price BETWEEN :priceMin AND :priceMax', { priceMin, priceMax });
    }

    if (price && SortEnum[price]) {
      filterOptions['pizza.price'] = SortEnum[price];
    }

    if (calories && SortEnum[calories]) {
      filterOptions['pizza.calories'] = SortEnum[calories];
    }

    if (favoritesCount && SortEnum[favoritesCount]) {
      filterOptions['pizza.favoritesCount'] = SortEnum[favoritesCount];
    }

    const pizzasCount = await baseQuery.getCount();

    const pizzas = await baseQuery
      .clone()
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(filterOptions)
      .getMany();

    const content = pizzas;
    const totalElements = pizzasCount;
    const totalPages = Math.ceil(totalElements / query.pageSize);
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
