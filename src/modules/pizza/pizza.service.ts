import { CreatePizzaDtoRequest } from '@modules/pizza/dto/create-pizza.dto';
import { PagedPizzaRequestDto } from '@modules/pizza/dto/paged-pizza.dto';
import { UpdatePizzaDtoRequest } from '@modules/pizza/dto/update-pizza.dto';
import { PizzaFiltersService } from '@modules/pizza/pizza-filters.service';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { PagedPizzaResponse } from '@modules/pizza/types/paged-pizza-response.interface';
import { PizzaResponse } from '@modules/pizza/types/pizza-response.interface';
import { UserEntity } from '@modules/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class PizzaService {
  constructor(
    @InjectRepository(PizzaEntity)
    private readonly pizzaRepository: Repository<PizzaEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly pizzaFiltersService: PizzaFiltersService,
  ) {}

  async findAll(userId: number, query: PagedPizzaRequestDto): Promise<PagedPizzaResponse> {
    let favoriteIds: number[] = [];

    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId }, relations: { favoritePizza: true } });
      favoriteIds = user?.favoritePizza.map((pizza) => pizza.id) ?? [];
    }

    const response = await this.pizzaFiltersService.getFilteredData(query);

    return {
      ...response,
      content: response.content.map((pizza) => ({ ...pizza, isFavorited: favoriteIds.includes(pizza.id) })),
    };
  }

  async getSinglePizza(id: number): Promise<PizzaEntity> {
    const pizza = await this.pizzaRepository.findOne({ where: { id } });

    if (!pizza) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    return pizza;
  }

  async getFavoritePizza(id: number): Promise<PizzaResponse[]> {
    const user = await this.userRepository.findOne({ where: { id }, relations: { favoritePizza: true } });

    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return user.favoritePizza.map((pizza) => ({ ...pizza, isFavorited: true }));
  }

  async create(createPizzaDto: CreatePizzaDtoRequest): Promise<PizzaEntity> {
    const { nameEn, nameUa, ingredients } = createPizzaDto;
    const isPizzaExist = await this.pizzaRepository.existsBy({ nameEn, nameUa });

    if (isPizzaExist) {
      throw new HttpException(`Pizza with "${nameEn}" and "${nameUa}" already exist.`, HttpStatus.CONFLICT);
    }

    const pizza = Object.assign(new PizzaEntity(), {
      ...createPizzaDto,
      ingredients: ingredients.map((ingredient) => ({ ...ingredient, id: randomInt(1, 1_000_000_000) })),
    });

    return await this.pizzaRepository.save(pizza);
  }

  async update(updateDto: UpdatePizzaDtoRequest, id: number): Promise<PizzaEntity> {
    const pizza = await this.getSinglePizza(id);

    return await this.pizzaRepository.save(Object.assign(pizza, updateDto));
  }

  async toggleFavorite(userId: number, pizzaId: number): Promise<PizzaEntity> {
    return await this.pizzaRepository.manager.transaction(async (manager) => {
      const isUserExist = await manager.existsBy(UserEntity, { id: userId });

      if (!isUserExist) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const pizza = await manager.findOne(PizzaEntity, { where: { id: pizzaId }, lock: { mode: 'pessimistic_write' } });

      if (!pizza) {
        throw new HttpException('Not found', HttpStatus.NOT_FOUND);
      }

      const isFavorited = await manager.exists(UserEntity, { where: { id: userId, favoritePizza: { id: pizzaId } } });
      const favoritePizza = manager.createQueryBuilder().relation(UserEntity, 'favoritePizza').of(userId);

      if (isFavorited) {
        await favoritePizza.remove(pizzaId);
      } else {
        await favoritePizza.add(pizzaId);
      }

      pizza.favoritesCount += isFavorited ? -1 : 1;

      return await manager.save(pizza);
    });
  }

  async deleteSinglePizza(id: number): Promise<DeleteResult> {
    const deleteResult = await this.pizzaRepository.delete(id);

    if (!deleteResult.affected) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    return deleteResult;
  }
}
