import { ExtraIngredientEntity } from '@modules/extra-ingredient/extra-ingredient.entity';
import { CreateOrderRequestDto } from '@modules/order/dto/create-order.dto';
import { OrderFilterService } from '@modules/order/order-filters.service';
import { OrderStatus, PaymentType } from '@modules/order/order.constants';
import { OrderEntity } from '@modules/order/order.entity';
import { OrderService } from '@modules/order/order.service';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { UserEntity } from '@modules/user/user.entity';
import { HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { In, Repository } from 'typeorm';

describe('OrderService', () => {
  const orderDto: CreateOrderRequestDto = {
    status: OrderStatus.PENDING,
    paymentType: PaymentType.CASH_PAYMENT,
    pizzas: [
      { pizzaId: 1, count: 2, extraIngredientsIds: [10], cheeseStuffedCrust: true, sausageStuffedCrust: false },
      { pizzaId: 2, count: 1, extraIngredientsIds: [], cheeseStuffedCrust: false, sausageStuffedCrust: true },
      { pizzaId: 1, count: 1, extraIngredientsIds: [], cheeseStuffedCrust: false, sausageStuffedCrust: false },
    ],
    primaryPhone: '+380501234567',
    username: 'john',
    comment: '',
  };
  const margherita = { id: 1, price: 200 };
  const pepperoni = { id: 2, price: 300 };
  const cheese = { id: 10, price: 30 };
  const orderPrice = (200 + 30 + 50) * 2 + (300 + 70) + 200;
  const orderFilters = { getFilteredData: jest.fn() };
  const transactionManager = { save: jest.fn() };
  let orderRepository: RepositoryMock & { manager: { transaction: jest.Mock } };
  let userRepository: RepositoryMock;
  let pizzaRepository: RepositoryMock;
  let ingredientRepository: RepositoryMock;
  let orderService: OrderService;

  beforeEach(() => {
    jest.clearAllMocks();
    orderRepository = {
      ...createRepositoryMock(),
      manager: {
        transaction: jest.fn((callback: (manager: typeof transactionManager) => Promise<void>) =>
          callback(transactionManager),
        ),
      },
    };
    userRepository = createRepositoryMock();
    pizzaRepository = createRepositoryMock();
    ingredientRepository = createRepositoryMock();
    pizzaRepository.findBy.mockResolvedValue([margherita, pepperoni]);
    ingredientRepository.findBy.mockResolvedValue([cheese]);
    orderService = new OrderService(
      orderRepository as unknown as Repository<OrderEntity>,
      userRepository as unknown as Repository<UserEntity>,
      pizzaRepository as unknown as Repository<PizzaEntity>,
      ingredientRepository as unknown as Repository<ExtraIngredientEntity>,
      orderFilters as unknown as OrderFilterService,
    );
  });

  it('delegates paging to the filter service', async () => {
    const query = { page: 1, pageSize: 10 } as never;
    orderFilters.getFilteredData.mockResolvedValue({ content: [] });

    await expect(orderService.findAll(query)).resolves.toEqual({ content: [] });
    expect(orderFilters.getFilteredData).toHaveBeenCalledWith(query);
  });

  describe('create', () => {
    it('saves a guest order with calculated price', async () => {
      const order = await orderService.create(orderDto);

      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(pizzaRepository.findBy).toHaveBeenCalledWith({ id: In([1, 2, 1]) });
      expect(ingredientRepository.findBy).toHaveBeenCalledWith({ id: In([10]) });
      expect(order).toMatchObject({ ...orderDto, price: orderPrice, userId: null });
    });

    it('links the order to the user and adds bonuses', async () => {
      const user = { id: 1, bonuses: 150 };
      userRepository.findOne.mockResolvedValue(user);

      const order = await orderService.create(orderDto, 1);

      expect(user.bonuses).toBe(250);
      expect(userRepository.save).toHaveBeenCalledWith(user);
      expect(order.userId).toBe(1);
    });

    it('saves a guest order when the user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(orderService.create(orderDto, 1)).resolves.toMatchObject({ userId: null });
    });

    it('rejects a pizza with both stuffed crusts', async () => {
      const pizzas = [{ ...orderDto.pizzas[0], cheeseStuffedCrust: true, sausageStuffedCrust: true }];

      await expect(orderService.create({ ...orderDto, pizzas })).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
      expect(pizzaRepository.findBy).not.toHaveBeenCalled();
    });

    it('rejects an unknown pizza', async () => {
      pizzaRepository.findBy.mockResolvedValue([margherita]);

      await expect(orderService.create(orderDto)).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('rejects an unknown extra ingredient', async () => {
      ingredientRepository.findBy.mockResolvedValue([]);

      await expect(orderService.create(orderDto)).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
      expect(orderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('rejects an unknown order', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(orderService.findById(1)).rejects.toMatchObject({
        message: 'Order not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('returns the order', async () => {
      orderRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(orderService.findById(1)).resolves.toEqual({ id: 1 });
    });
  });

  describe('buildCreateOrderResult', () => {
    it('rejects an unknown order', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(orderService.buildCreateOrderResult(1)).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
    });

    it('keeps every order line and returns the stored price', async () => {
      orderRepository.findOne.mockResolvedValue({ id: 5, ...orderDto, price: 999 });

      const result = await orderService.buildCreateOrderResult(5);

      expect(result).toEqual({
        id: 5,
        price: 999,
        pizzas: [
          {
            pizza: margherita,
            extraIngredients: [cheese],
            count: 2,
            cheeseStuffedCrust: true,
            sausageStuffedCrust: false,
          },
          { pizza: pepperoni, extraIngredients: [], count: 1, cheeseStuffedCrust: false, sausageStuffedCrust: true },
          { pizza: margherita, extraIngredients: [], count: 1, cheeseStuffedCrust: false, sausageStuffedCrust: false },
        ],
      });
    });
  });

  describe('payOrder', () => {
    it('rejects an unknown order', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        orderService.payOrder({ orderId: 1, paymentType: PaymentType.ONLINE_PAYMENT }),
      ).rejects.toMatchObject({ message: 'Payment failed. Order not found', status: HttpStatus.BAD_REQUEST });
    });

    it('rejects an already paid order', async () => {
      orderRepository.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PAID });

      await expect(
        orderService.payOrder({ orderId: 1, paymentType: PaymentType.ONLINE_PAYMENT }),
      ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
    });

    it('marks the order as paid', async () => {
      orderRepository.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING });

      await orderService.payOrder({ orderId: 1, paymentType: PaymentType.ONLINE_PAYMENT });

      expect(orderRepository.save).toHaveBeenCalledWith({
        id: 1,
        status: OrderStatus.PAID,
        paymentType: PaymentType.ONLINE_PAYMENT,
      });
    });

    it('pays the order with bonuses', async () => {
      const user = { id: 3, bonuses: 500 };
      orderRepository.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING, price: 400, userId: 3 });
      userRepository.findOne.mockResolvedValue(user);

      await orderService.payOrder({ orderId: 1, paymentType: PaymentType.BONUS_PAYMENT });

      expect(user.bonuses).toBe(100);
      expect(transactionManager.save).toHaveBeenCalledWith(user);
      expect(transactionManager.save).toHaveBeenCalledWith(expect.objectContaining({ status: OrderStatus.PAID }));
    });

    it('rejects bonus payment when bonuses are not enough', async () => {
      orderRepository.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING, price: 400, userId: 3 });
      userRepository.findOne.mockResolvedValue({ id: 3, bonuses: 100 });

      await expect(orderService.payOrder({ orderId: 1, paymentType: PaymentType.BONUS_PAYMENT })).rejects.toMatchObject(
        { message: 'Payment failed. Not enough bonuses', status: HttpStatus.BAD_REQUEST },
      );
      expect(transactionManager.save).not.toHaveBeenCalled();
    });
  });
});
