import { CreatePizzaDtoRequest } from '@modules/pizza/dto/create-pizza.dto';
import { PizzaFiltersService } from '@modules/pizza/pizza-filters.service';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { PizzaService } from '@modules/pizza/pizza.service';
import { UserEntity } from '@modules/user/user.entity';
import { HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { createTransactionManagerMock, TransactionManagerMock } from '@test/helpers/transaction-manager.mock';
import { Repository } from 'typeorm';

jest.mock('node:crypto', () => ({ randomInt: () => 42 }));

describe('PizzaService', () => {
  const pizzaDto = {
    imgUrl: 'https://x.com/pizza.png',
    nameEn: 'Margherita',
    nameUa: 'Маргарита',
    ingredients: [{ nameEn: 'Tomato', nameUa: 'Томат' }],
    calories: 800,
    price: 200,
  } as CreatePizzaDtoRequest;
  const pizzaFiltersService = { getFilteredData: jest.fn() };
  let pizzaRepository: RepositoryMock;
  let userRepository: RepositoryMock;
  let pizzaService: PizzaService;

  beforeEach(() => {
    pizzaRepository = createRepositoryMock();
    userRepository = createRepositoryMock();
    pizzaFiltersService.getFilteredData.mockReset();
    pizzaService = new PizzaService(
      pizzaRepository as unknown as Repository<PizzaEntity>,
      userRepository as unknown as Repository<UserEntity>,
      pizzaFiltersService as unknown as PizzaFiltersService,
    );
  });

  describe('findAll', () => {
    const query = { page: 1, pageSize: 10 } as never;

    beforeEach(() => {
      pizzaFiltersService.getFilteredData.mockResolvedValue({ totalElements: 2, content: [{ id: 1 }, { id: 2 }] });
    });

    it('marks the favorite pizzas of the user', async () => {
      userRepository.findOne.mockResolvedValue({ favoritePizza: [{ id: 2 }] });

      await expect(pizzaService.findAll(1, query)).resolves.toEqual({
        totalElements: 2,
        content: [
          { id: 1, isFavorited: false },
          { id: 2, isFavorited: true },
        ],
      });
    });

    it('marks nothing for a guest', async () => {
      const { content } = await pizzaService.findAll(undefined, query);

      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(content.every((pizza) => !pizza.isFavorited)).toBe(true);
    });

    it('marks nothing for a user that no longer exists', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const { content } = await pizzaService.findAll(1, query);

      expect(content.every((pizza) => !pizza.isFavorited)).toBe(true);
    });
  });

  it('rejects an unknown pizza', async () => {
    pizzaRepository.findOne.mockResolvedValue(null);

    await expect(pizzaService.getSinglePizza(1)).rejects.toMatchObject({
      message: 'Not found',
      status: HttpStatus.NOT_FOUND,
    });
  });

  describe('getFavoritePizza', () => {
    it('rejects an unknown user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(pizzaService.getFavoritePizza(1)).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
    });

    it('returns the favorite pizzas as favorited', async () => {
      userRepository.findOne.mockResolvedValue({ favoritePizza: [{ id: 2 }] });

      await expect(pizzaService.getFavoritePizza(1)).resolves.toEqual([{ id: 2, isFavorited: true }]);
    });
  });

  describe('create', () => {
    it('rejects a duplicate name', async () => {
      pizzaRepository.existsBy.mockResolvedValue(true);

      await expect(pizzaService.create(pizzaDto)).rejects.toMatchObject({
        message: 'Pizza with "Margherita" and "Маргарита" already exist.',
        status: HttpStatus.CONFLICT,
      });
    });

    it('assigns ids to the ingredients', async () => {
      pizzaRepository.existsBy.mockResolvedValue(false);

      const pizza = await pizzaService.create(pizzaDto);

      expect(pizza).toBeInstanceOf(PizzaEntity);
      expect(pizza.ingredients).toEqual([{ id: 42, nameEn: 'Tomato', nameUa: 'Томат' }]);
      expect(pizzaDto.ingredients).toEqual([{ nameEn: 'Tomato', nameUa: 'Томат' }]);
    });
  });

  describe('update', () => {
    it('rejects an unknown pizza', async () => {
      pizzaRepository.findOne.mockResolvedValue(null);

      await expect(pizzaService.update({ price: 250 }, 1)).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });

    it('merges and saves the changes', async () => {
      pizzaRepository.findOne.mockResolvedValue({ id: 1, ...pizzaDto });

      await expect(pizzaService.update({ price: 250 }, 1)).resolves.toMatchObject({ id: 1, price: 250 });
    });
  });

  describe('toggleFavorite', () => {
    let manager: TransactionManagerMock;

    beforeEach(() => {
      manager = createTransactionManagerMock();
      pizzaRepository.manager.transaction.mockImplementation(
        (callback: (transactionManager: TransactionManagerMock) => Promise<PizzaEntity>) => callback(manager),
      );
    });

    it('rejects a user that no longer exists', async () => {
      manager.existsBy.mockResolvedValue(false);

      await expect(pizzaService.toggleFavorite(1, 1)).rejects.toMatchObject({
        message: 'Unauthorized',
        status: HttpStatus.UNAUTHORIZED,
      });
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rejects an unknown pizza', async () => {
      manager.existsBy.mockResolvedValue(true);
      manager.findOne.mockResolvedValue(null);

      await expect(pizzaService.toggleFavorite(1, 1)).rejects.toMatchObject({
        message: 'Not found',
        status: HttpStatus.NOT_FOUND,
      });
      expect(manager.relation.add).not.toHaveBeenCalled();
    });

    it('locks the pizza row', async () => {
      manager.existsBy.mockResolvedValue(true);
      manager.findOne.mockResolvedValue({ id: 1, favoritesCount: 4 });
      manager.exists.mockResolvedValue(false);

      await pizzaService.toggleFavorite(1, 1);

      expect(manager.findOne).toHaveBeenCalledWith(PizzaEntity, {
        where: { id: 1 },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('adds a pizza to favorites', async () => {
      manager.existsBy.mockResolvedValue(true);
      manager.findOne.mockResolvedValue({ id: 1, favoritesCount: 4 });
      manager.exists.mockResolvedValue(false);

      const pizza = await pizzaService.toggleFavorite(1, 1);

      expect(pizza.favoritesCount).toBe(5);
      expect(manager.relation.add).toHaveBeenCalledWith(1);
      expect(manager.relation.remove).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledWith(pizza);
    });

    it('removes a pizza from favorites', async () => {
      manager.existsBy.mockResolvedValue(true);
      manager.findOne.mockResolvedValue({ id: 1, favoritesCount: 4 });
      manager.exists.mockResolvedValue(true);

      const pizza = await pizzaService.toggleFavorite(1, 1);

      expect(pizza.favoritesCount).toBe(3);
      expect(manager.relation.remove).toHaveBeenCalledWith(1);
      expect(manager.relation.add).not.toHaveBeenCalled();
    });
  });

  describe('deleteSinglePizza', () => {
    it('rejects an unknown pizza', async () => {
      pizzaRepository.delete.mockResolvedValue({ raw: [], affected: 0 });

      await expect(pizzaService.deleteSinglePizza(1)).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });

    it('deletes the pizza by id', async () => {
      pizzaRepository.delete.mockResolvedValue({ raw: [], affected: 1 });

      await pizzaService.deleteSinglePizza(1);

      expect(pizzaRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
