import { AdminEntity } from '@modules/admin/admin.entity';
import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { UserEntity } from '@modules/user/user.entity';
import { createQueryBuilderMock } from '@test/helpers/query-builder.mock';
import { RepositoryMock } from '@test/helpers/repository.mock';
import { createAdminAuthHeader, createAuthHeader, createTestApp, TestApp } from '@test/helpers/test-app.helper';
import { createTransactionManagerMock, TransactionManagerMock } from '@test/helpers/transaction-manager.mock';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Pizza (e2e)', () => {
  const user = { id: 1, email: 'john@x.com', username: 'john', tokenVersion: 0 };
  const authHeader = createAuthHeader(user);
  const admin = { id: 5, email: 'admin@x.com', tokenVersion: 0 };
  const adminAuthHeader = createAdminAuthHeader(admin);
  const pizza = { id: 1, nameEn: 'Margherita', nameUa: 'Маргарита', price: 200, calories: 800, favoritesCount: 0 };
  const newPizza = {
    imgUrl: 'https://x.com/pizza.png',
    nameEn: 'Margherita',
    nameUa: 'Маргарита',
    ingredients: [{ nameEn: 'Tomato', nameUa: 'Томат' }],
    calories: 800,
    price: 200,
  };
  let testApp: TestApp;
  let server: App;
  let pizzaRepository: RepositoryMock;
  let userRepository: RepositoryMock;

  const authorize = () => userRepository.findOne.mockResolvedValueOnce(user);
  const authorizeAdmin = () => testApp.repository(AdminEntity).findOne.mockResolvedValueOnce(admin);

  beforeAll(async () => {
    testApp = await createTestApp();
    server = testApp.app.getHttpServer();
  });

  beforeEach(() => {
    testApp.resetMocks();
    pizzaRepository = testApp.repository(PizzaEntity);
    userRepository = testApp.repository(UserEntity);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('GET /pizza', () => {
    it('returns a page of pizzas for a guest', async () => {
      pizzaRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([pizza]));

      const response = await request(server).get('/pizza').query({ page: 1, pageSize: 10 }).expect(200);

      expect(response.body).toEqual({
        totalPages: 1,
        totalElements: 1,
        pageSize: 10,
        pageNumber: 1,
        nextPage: false,
        prevPage: false,
        content: [{ ...pizza, isFavorited: false }],
      });
    });

    it('marks favorites of the logged user', async () => {
      pizzaRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([pizza]));
      authorize().mockResolvedValueOnce({ ...user, favoritePizza: [pizza] });

      const response = await request(server)
        .get('/pizza')
        .set('Authorization', authHeader)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body).toMatchObject({ content: [{ id: 1, isFavorited: true }] });
    });

    it('marks nothing for an outdated token', async () => {
      pizzaRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([pizza]));
      userRepository.findOne.mockResolvedValue(null);

      const response = await request(server)
        .get('/pizza')
        .set('Authorization', authHeader)
        .query({ page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body).toMatchObject({ content: [{ id: 1, isFavorited: false }] });
    });

    it.each([
      [{ page: 0, pageSize: 10 }, 'The page value must be at least 1.'],
      [{ page: 1, pageSize: 10, price: 'UP' }, 'price must be one of the following values: ASC, DESC'],
      [{ page: 1, pageSize: 10, priceMin: 0 }, 'The min price value must be at least 1.'],
      [{ page: 1, pageSize: 10, priceMax: 'abc' }, 'priceMax must be a number'],
      [{ page: 1, pageSize: 10, size: 'L' }, 'property size should not exist'],
    ])('rejects the query %p', async (query, message) => {
      const response = await request(server).get('/pizza').query(query).expect(400);

      expect(response.body).toMatchObject({ message: [message] });
    });
  });

  describe('GET /pizza/:id', () => {
    it('returns a pizza', async () => {
      pizzaRepository.findOne.mockResolvedValue(pizza);

      await request(server).get('/pizza/1').expect(200, pizza);
    });

    it('responds 404 for an unknown pizza', async () => {
      pizzaRepository.findOne.mockResolvedValue(null);

      await request(server).get('/pizza/1').expect(404);
    });

    it('rejects a non-numeric id', async () => {
      await request(server).get('/pizza/abc').expect(400);
    });
  });

  describe('GET /pizza/favorite', () => {
    it('requires authorization', async () => {
      await request(server).get('/pizza/favorite').expect(401);
    });

    it('returns the favorite pizzas', async () => {
      authorize().mockResolvedValueOnce({ ...user, favoritePizza: [pizza] });

      await request(server)
        .get('/pizza/favorite')
        .set('Authorization', authHeader)
        .expect(200, [{ ...pizza, isFavorited: true }]);
    });
  });

  describe('POST /pizza/create', () => {
    it('requires authorization', async () => {
      await request(server).post('/pizza/create').send(newPizza).expect(401);
    });

    it('rejects a client', async () => {
      authorize();

      await request(server).post('/pizza/create').set('Authorization', authHeader).send(newPizza).expect(403);
      expect(pizzaRepository.save).not.toHaveBeenCalled();
    });

    it('creates a pizza', async () => {
      authorizeAdmin();
      pizzaRepository.existsBy.mockResolvedValue(false);

      const response = await request(server)
        .post('/pizza/create')
        .set('Authorization', adminAuthHeader)
        .send(newPizza)
        .expect(201);

      expect(response.body).toMatchObject({
        nameEn: 'Margherita',
        ingredients: [{ id: expect.any(Number) as number, nameEn: 'Tomato', nameUa: 'Томат' }],
      });
    });

    it('rejects an invalid image url', async () => {
      authorizeAdmin();

      const response = await request(server)
        .post('/pizza/create')
        .set('Authorization', adminAuthHeader)
        .send({ ...newPizza, imgUrl: 'not-a-url', ingredients: [{ nameEn: '', nameUa: 'Томат' }] })
        .expect(400);

      expect(response.body).toMatchObject({
        message: ['imgUrl must be a URL address', 'ingredients.0.nameEn should not be empty'],
      });
    });

    it('rejects a duplicate', async () => {
      authorizeAdmin();
      pizzaRepository.existsBy.mockResolvedValue(true);

      await request(server).post('/pizza/create').set('Authorization', adminAuthHeader).send(newPizza).expect(409);
    });
  });

  describe('PUT /pizza/update/:id', () => {
    it('requires authorization', async () => {
      await request(server).put('/pizza/update/1').send({ price: 250 }).expect(401);
    });

    it('updates a pizza', async () => {
      authorizeAdmin();
      pizzaRepository.findOne.mockResolvedValue({ ...pizza });

      await request(server)
        .put('/pizza/update/1')
        .set('Authorization', adminAuthHeader)
        .send({ price: 250 })
        .expect(200, { ...pizza, price: 250 });
    });
  });

  describe('PUT /pizza/toggle/favorite/:id', () => {
    it('requires authorization', async () => {
      await request(server).put('/pizza/toggle/favorite/1').expect(401);
    });

    it('rejects an outdated token', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await request(server).put('/pizza/toggle/favorite/1').set('Authorization', authHeader).expect(401);
      expect(pizzaRepository.manager.transaction).not.toHaveBeenCalled();
    });

    it('adds a pizza to favorites', async () => {
      const manager = createTransactionManagerMock();
      authorize();
      manager.existsBy.mockResolvedValue(true);
      manager.findOne.mockResolvedValue({ ...pizza });
      manager.exists.mockResolvedValue(false);
      pizzaRepository.manager.transaction.mockImplementation(
        (callback: (transactionManager: TransactionManagerMock) => Promise<PizzaEntity>) => callback(manager),
      );

      await request(server)
        .put('/pizza/toggle/favorite/1')
        .set('Authorization', authHeader)
        .expect(200, { ...pizza, favoritesCount: 1 });
    });
  });

  describe('DELETE /pizza/delete/:id', () => {
    it('requires authorization', async () => {
      await request(server).delete('/pizza/delete/1').expect(401);
    });

    it('rejects a client', async () => {
      authorize();

      await request(server).delete('/pizza/delete/1').set('Authorization', authHeader).expect(403);
      expect(pizzaRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes a pizza', async () => {
      authorizeAdmin();
      pizzaRepository.delete.mockResolvedValue({ raw: [], affected: 1 });

      await request(server)
        .delete('/pizza/delete/1')
        .set('Authorization', adminAuthHeader)
        .expect(200, { raw: [], affected: 1 });
    });

    it('responds 404 for an unknown pizza', async () => {
      authorizeAdmin();
      pizzaRepository.delete.mockResolvedValue({ raw: [], affected: 0 });

      await request(server).delete('/pizza/delete/1').set('Authorization', adminAuthHeader).expect(404);
    });
  });
});
