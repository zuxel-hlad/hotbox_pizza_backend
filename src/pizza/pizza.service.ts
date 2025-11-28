import { CreatePizzaDtoRequest, PagedPizzaRequestDto, UpdatePizzaDtoRequest } from '@app/pizza/dto';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { PizzaFiltersService } from '@app/pizza/pizza.filters.service';
import { PagedPizzaResponse } from '@app/pizza/types/paged.pizza.response.interface';
import { PizzaResponse } from '@app/pizza/types/pizza.response.interface';
import { UserEntity } from '@app/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResult } from 'typeorm/browser';

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
      const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['favoritePizza'] });
      favoriteIds = user.favoritePizza.map((pizza) => pizza.id);
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
    const user = await this.userRepository.findOne({ where: { id }, relations: ['favoritePizza'] });

    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const pizzaResponse = user.favoritePizza.map((pizza) => ({ ...pizza, isFavorited: true }));

    return pizzaResponse;
  }

  async create(createPizzaDto: CreatePizzaDtoRequest): Promise<PizzaEntity> {
    const { nameEn, nameUa } = createPizzaDto;
    const isPizzaExist = await this.pizzaRepository.findOne({ where: { nameEn, nameUa } });

    if (isPizzaExist) {
      throw new HttpException(`Pizza with "${nameEn}" and "${nameUa}" already exist.`, HttpStatus.CONFLICT);
    }

    const pizza = Object.assign(new PizzaEntity(), createPizzaDto);

    pizza.ingredients = pizza.ingredients.map((ingredient) => ({ ...ingredient, id: this.generateId() }));

    return await this.pizzaRepository.save(pizza);
  }

  async update(updateDto: UpdatePizzaDtoRequest, id: number): Promise<PizzaEntity> {
    const pizza = await this.pizzaRepository.findOne({ where: { id } });

    if (!pizza) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    const updatedPizza = Object.assign(pizza, updateDto);

    return await this.pizzaRepository.save(updatedPizza);
  }

  async toggleFavorite(userId: number, pizzaId: number): Promise<PizzaEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['favoritePizza'] });

    const pizza = await this.pizzaRepository.findOne({ where: { id: pizzaId } });
    if (!pizza) throw new HttpException('Pizza not found', HttpStatus.NOT_FOUND);

    const isFavorited = user.favoritePizza.some((p) => p.id === pizza.id);

    if (!isFavorited) {
      user.favoritePizza.push(pizza);
      pizza.favoritesCount += 1;

      await this.userRepository.save(user);
      await this.pizzaRepository.save(pizza);

      return pizza;
    }

    if (isFavorited) {
      user.favoritePizza = user.favoritePizza.filter((favoritePizza) => favoritePizza.id !== pizza.id);

      pizza.favoritesCount -= 1;

      await this.userRepository.save(user);
      await this.pizzaRepository.save(pizza);

      return pizza;
    }
  }

  async deleteSinglePizza(id: number): Promise<DeleteResult> {
    const pizza = await this.pizzaRepository.findOne({ where: { id } });

    if (!pizza) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    return await this.pizzaRepository.delete({ id: pizza.id });
  }

  generateId(): number {
    const min = 1;
    const max = 1_000_000_000;

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
