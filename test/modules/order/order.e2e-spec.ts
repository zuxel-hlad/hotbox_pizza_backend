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
  const order = { id: 5, ...newOrder, userId: null };
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

    it('rejects an unknown status', async () => {
      await request(server).get('/order/list').query({ page: 1, pageSize: 10, status: 'LOST' }).expect(400);
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

  it('GET /order/result/:id calculates the price', async () => {
    orderRepository.findOne.mockResolvedValue(order);
    testApp.repository(PizzaEntity).findBy.mockResolvedValue([{ id: 1, price: 200 }]);
    testApp.repository(ExtraIngredientEntity).findBy.mockResolvedValue([{ id: 10, price: 30 }]);

    const response = await request(server).get('/order/result/5').expect(200);

    expect(response.body).toMatchObject({ id: 5, price: 50 + 30 * 2 + 200 * 2 });
  });

  describe('POST /order/create', () => {
    it('creates a guest order', async () => {
      const response = await request(server).post('/order/create').send(newOrder).expect(201);

      expect(response.body).toMatchObject({ ...newOrder, userId: null });
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

    it('rejects an invalid phone', async () => {
      await request(server)
        .post('/order/create')
        .send({ ...newOrder, primaryPhone: '123' })
        .expect(400);
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
