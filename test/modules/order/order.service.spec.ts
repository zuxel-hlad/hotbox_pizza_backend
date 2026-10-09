import { CreateOrderRequestDto } from '@modules/order/dto/create-order.dto';
import { OrderFilterService } from '@modules/order/order-filters.service';
import { OrderStatus, PaymentType } from '@modules/order/order.constants';
import { OrderEntity } from '@modules/order/order.entity';
import { OrderService } from '@modules/order/order.service';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { UserEntity } from '@modules/user/user.entity';
import { HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { DataSource, In, Repository } from 'typeorm';

describe('OrderService', () => {
  const orderDto: CreateOrderRequestDto = {
    status: OrderStatus.PENDING,
    paymentType: PaymentType.CASH_PAYMENT,
    pizzas: [
      { pizzaId: 1, count: 2, extraIngredientsIds: [10], cheeseStuffedCrust: true, sausageStuffedCrust: false },
      { pizzaId: 2, count: 1, extraIngredientsIds: [], cheeseStuffedCrust: false, sausageStuffedCrust: true },
    ],
    primaryPhone: '+380501234567',
    username: 'john',
    comment: '',
  };
  const orderFilters = { getFilteredData: jest.fn() };
  let orderRepository: RepositoryMock;
  let userRepository: RepositoryMock;
  let pizzaRepository: RepositoryMock;
  let ingredientRepository: RepositoryMock;
  let orderService: OrderService;

  beforeEach(() => {
    orderRepository = createRepositoryMock();
    userRepository = createRepositoryMock();
    pizzaRepository = createRepositoryMock();
    ingredientRepository = createRepositoryMock();
    const dataSource = {
      getRepository: (entity: unknown) => (entity === PizzaEntity ? pizzaRepository : ingredientRepository),
    };
    orderService = new OrderService(
      orderRepository as unknown as Repository<OrderEntity>,
      orderFilters as unknown as OrderFilterService,
      userRepository as unknown as Repository<UserEntity>,
      dataSource as unknown as DataSource,
    );
  });

  it('delegates paging to the filter service', async () => {
    const query = { page: 1, pageSize: 10 } as never;
    orderFilters.getFilteredData.mockResolvedValue({ content: [] });

    await expect(orderService.findAll(query)).resolves.toEqual({ content: [] });
    expect(orderFilters.getFilteredData).toHaveBeenCalledWith(query);
  });

  describe('create', () => {
    it('saves a guest order', async () => {
      const order = await orderService.create(orderDto);

      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(order).toMatchObject({ ...orderDto, userId: null, user: null });
      expect(orderRepository.save).toHaveBeenCalledWith(order, { data: { user: false } });
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

    it('calculates the order price', async () => {
      const margherita = { id: 1, price: 200 };
      const pepperoni = { id: 2, price: 300 };
      const cheese = { id: 10, price: 30 };
      orderRepository.findOne.mockResolvedValue({ id: 5, ...orderDto });
      pizzaRepository.findBy.mockResolvedValue([margherita, pepperoni]);
      ingredientRepository.findBy.mockResolvedValue([cheese]);

      const result = await orderService.buildCreateOrderResult(5);

      expect(pizzaRepository.findBy).toHaveBeenCalledWith({ id: In([1, 2]) });
      expect(ingredientRepository.findBy).toHaveBeenCalledWith({ id: In([10]) });
      expect(result).toEqual({
        id: 5,
        price: 50 + 30 * 2 + 200 * 2 + 70 + 300,
        pizzas: [
          {
            pizza: margherita,
            extraIngredients: [cheese],
            count: 2,
            cheeseStuffedCrust: true,
            sausageStuffedCrust: false,
          },
          { pizza: pepperoni, extraIngredients: [], count: 1, cheeseStuffedCrust: false, sausageStuffedCrust: true },
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

    it('marks the order as paid', async () => {
      orderRepository.findOne.mockResolvedValue({ id: 1, status: OrderStatus.PENDING });

      await orderService.payOrder({ orderId: 1, paymentType: PaymentType.ONLINE_PAYMENT });

      expect(orderRepository.save).toHaveBeenCalledWith({
        id: 1,
        status: OrderStatus.PAID,
        paymentType: PaymentType.ONLINE_PAYMENT,
      });
    });
  });
});
