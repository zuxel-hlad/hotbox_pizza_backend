import { CreatePizzaDtoRequest, UpdatePizzaDtoRequest } from '@app/pizza/dto';
import { PizzaEntity } from '@app/pizza/pizza.entity';
import { UserEntity } from '@app/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeleteResult } from 'typeorm/browser';
import { PizzaResponseInterface } from './types/pizza.response.interface';

@Injectable()
export class PizzaService {
  constructor(
    @InjectRepository(PizzaEntity)
    private readonly pizzaRepository: Repository<PizzaEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(userId: number): Promise<PizzaResponseInterface[]> {
    let favoriteIds: number[] = [];

    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['favoritePizza'] });
      favoriteIds = user.favoritePizza.map((pizza) => pizza.id);
    }

    const pizzas = await this.pizzaRepository.find();

    return pizzas.map((pizza) => ({ ...pizza, isFavorited: favoriteIds.includes(pizza.id) }));
  }

  async getSinglePizza(id: number): Promise<PizzaEntity> {
    const pizza = await this.pizzaRepository.findOne({ where: { id } });

    if (!pizza) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    return pizza;
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

  generateId(): number {
    const min = 1;
    const max = 1_000_000_000;

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async deleteSinglePizza(id: number): Promise<DeleteResult> {
    const pizza = await this.pizzaRepository.findOne({ where: { id } });

    if (!pizza) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    return await this.pizzaRepository.delete({ id: pizza.id });
  }
}
