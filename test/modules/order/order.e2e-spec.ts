import { ExtraIngredientEntity } from '@modules/extra-ingredient/extra-ingredient.entity';
import { OrderStatus, PaymentType } from '@modules/order/order.constants';
import { OrderEntity } from '@modules/order/order.entity';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { UserEntity } from '@modules/user/user.entity';
import { RepositoryMock } from '@test/helpers/repository.mock';
import { createAuthHeader, createTestApp, TestApp } from '@test/helpers/test-app.helper';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Order (e2e)', () => {
  const user = { id: 1, email: 'john@x.com', username: 'john', tokenVersion: 0, bonuses: 150 };
  const newOrder = {
    status: OrderStatus.PENDING,
    paymentType: PaymentType.CASH_PAYMENT,
    pizzas: [{ pizzaId: 1, count: 2, extraIngredientsIds: [10], cheeseStuffedCrust: true, sausageStuffedCrust: false }],
    primaryPhone: '+380501234567',
    username: 'john',
    comment: '',
  };
  const orderPrice = (200 + 30 + 50) * 2;
  const order = { id: 5, ...newOrder, price: orderPrice, userId: null };
  let testApp: TestApp;
  let server: App;
  let orderRepository: RepositoryMock;
  let userRepository: RepositoryMock;

  beforeAll(async () => {
    testApp = await createTestApp();
    server = testApp.app.getHttpServer();
  });

  beforeEach(() => {
    testApp.resetMocks();
    orderRepository = testApp.repository(OrderEntity);
    userRepository = testApp.repository(UserEntity);
    testApp.repository(PizzaEntity).findBy.mockResolvedValue([{ id: 1, price: 200 }]);
    testApp.repository(ExtraIngredientEntity).findBy.mockResolvedValue([{ id: 10, price: 30 }]);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('GET /order/list', () => {
    it('returns a page of orders', async () => {
      orderRepository.findAndCount.mockResolvedValue([[order], 1]);

      const response = await request(server)
        .get('/order/list')
        .query({ page: 1, pageSize: 10, status: OrderStatus.PENDING })
        .expect(200);

      expect(response.body).toMatchObject({ totalElements: 1, totalPages: 1, content: [order] });
    });

    it.each([
      [{ status: 'LOST' }, 'status must be one of the following values: CANCELED, DONE, PENDING, PAID'],
      [{ orderId: 'abc' }, 'orderId must be a number'],
      [{ createdAt: '01.01.2026' }, 'createdAt must be a valid ISO 8601 date string'],
      [{ primaryPhone: '0501234567' }, 'primaryPhone must be a valid phone number'],
    ])('rejects the query %p', async (query, message) => {
      const response = await request(server)
        .get('/order/list')
        .query({ page: 1, pageSize: 10, ...query })
        .expect(400);

      expect(response.body).toMatchObject({ message: [message] });
    });
  });

  describe('GET /order/:id', () => {
    it('returns an order', async () => {
      orderRepository.findOne.mockResolvedValue(order);

      await request(server).get('/order/5').expect(200, order);
    });

    it('responds 404 for an unknown order', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      const response = await request(server).get('/order/5').expect(404);

      expect(response.body).toMatchObject({ message: 'Order not found' });
    });
  });

  it('GET /order/result/:id returns the order with its pizzas', async () => {
    orderRepository.findOne.mockResolvedValue(order);

    const response = await request(server).get('/order/result/5').expect(200);

    expect(response.body).toMatchObject({ id: 5, price: orderPrice, pizzas: [{ pizza: { id: 1 }, count: 2 }] });
  });

  describe('POST /order/create', () => {
    it('creates a guest order', async () => {
      const response = await request(server).post('/order/create').send(newOrder).expect(201);

      expect(response.body).toMatchObject({ ...newOrder, price: orderPrice, userId: null });
    });

    it('links the order to the logged user and adds bonuses', async () => {
      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce({ ...user });

      const response = await request(server)
        .post('/order/create')
        .set('Authorization', createAuthHeader(user))
        .send(newOrder)
        .expect(201);

      expect(response.body).toMatchObject({ userId: 1 });
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ bonuses: 250 }));
    });

    it('ignores a foreign user id sent by a client', async () => {
      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce({ ...user });

      const response = await request(server)
        .post('/order/create')
        .set('Authorization', createAuthHeader(user))
        .send({ ...newOrder, userId: 99 })
        .expect(201);

      expect(response.body).toMatchObject({ userId: 1, adminId: null });
      expect(userRepository.findOne).toHaveBeenLastCalledWith({ where: { id: 1 } });
    });

    it('defaults a missing comment to an empty string', async () => {
      const response = await request(server)
        .post('/order/create')
        .send({ ...newOrder, comment: undefined })
        .expect(201);

      expect(response.body).toMatchObject({ comment: '' });
    });

    it.each([
      [{ primaryPhone: '123' }, 'primaryPhone must be a valid phone number'],
      [{ pizzas: [] }, 'pizzas should not be empty'],
      [
        { pizzas: [{ ...newOrder.pizzas[0], extraIngredientsIds: [10, 10] }] },
        'pizzas.0.extraIngredientsIds elements must be unique',
      ],
      [{ pizzas: [{ ...newOrder.pizzas[0], count: 0 }] }, 'pizzas.0.count must not be less than 1'],
    ])('rejects %p', async (body, message) => {
      const response = await request(server)
        .post('/order/create')
        .send({ ...newOrder, ...body })
        .expect(400);

      expect(response.body).toMatchObject({ message: [message] });
    });
  });

  describe('POST /order/payment', () => {
    it('marks the order as paid', async () => {
      orderRepository.findOne.mockResolvedValue({ ...order });

      await request(server)
        .post('/order/payment')
        .send({ orderId: 5, paymentType: PaymentType.ONLINE_PAYMENT })
        .expect(201);

      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.PAID, paymentType: PaymentType.ONLINE_PAYMENT }),
      );
    });

    it('rejects an unknown order', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await request(server)
        .post('/order/payment')
        .send({ orderId: 5, paymentType: PaymentType.ONLINE_PAYMENT })
        .expect(400);
    });
  });
});
