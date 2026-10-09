import { PizzaEntity } from '@modules/pizza/pizza.entity';
import { UserEntity } from '@modules/user/user.entity';
import { createQueryBuilderMock } from '@test/helpers/query-builder.mock';
import { RepositoryMock } from '@test/helpers/repository.mock';
import { createAuthHeader, createTestApp, TestApp } from '@test/helpers/test-app.helper';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Pizza (e2e)', () => {
  const user = { id: 1, email: 'john@x.com', username: 'john', tokenVersion: 0 };
  const authHeader = createAuthHeader(user);
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

    it.each([
      [{ page: 0, pageSize: 10 }, 'The page value must be at least 1.'],
      [{ page: 1, pageSize: 10, price: 'UP' }, 'price must be one of the following values: ASC, DESC'],
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

    it('creates a pizza', async () => {
      authorize();
      pizzaRepository.findOne.mockResolvedValue(null);

      const response = await request(server)
        .post('/pizza/create')
        .set('Authorization', authHeader)
        .send(newPizza)
        .expect(201);

      expect(response.body).toMatchObject({
        nameEn: 'Margherita',
        ingredients: [{ id: expect.any(Number) as number, nameEn: 'Tomato', nameUa: 'Томат' }],
      });
    });

    it('rejects an invalid image url', async () => {
      authorize();

      await request(server)
        .post('/pizza/create')
        .set('Authorization', authHeader)
        .send({ ...newPizza, imgUrl: 'not-a-url' })
        .expect(400);
    });

    it('rejects a duplicate', async () => {
      authorize();
      pizzaRepository.findOne.mockResolvedValue(pizza);

      await request(server).post('/pizza/create').set('Authorization', authHeader).send(newPizza).expect(409);
    });
  });

  describe('PUT /pizza/update/:id', () => {
    it('requires authorization', async () => {
      await request(server).put('/pizza/update/1').send({ price: 250 }).expect(401);
    });

    it('updates a pizza', async () => {
      authorize();
      pizzaRepository.findOne.mockResolvedValue({ ...pizza });

      await request(server)
        .put('/pizza/update/1')
        .set('Authorization', authHeader)
        .send({ price: 250 })
        .expect(200, { ...pizza, price: 250 });
    });
  });

  describe('PUT /pizza/toggle/favorite/:id', () => {
    it('requires authorization', async () => {
      await request(server).put('/pizza/toggle/favorite/1').expect(401);
    });

    it('adds a pizza to favorites', async () => {
      authorize().mockResolvedValueOnce({ ...user, favoritePizza: [] });
      pizzaRepository.findOne.mockResolvedValue({ ...pizza });

      await request(server)
        .put('/pizza/toggle/favorite/1')
        .set('Authorization', authHeader)
        .expect(200, { ...pizza, favoritesCount: 1 });
    });
  });

  describe('DELETE /pizza/delete/:id', () => {
    it('deletes a pizza without authorization (known gap)', async () => {
      pizzaRepository.findOne.mockResolvedValue(pizza);
      pizzaRepository.delete.mockResolvedValue({ raw: [], affected: 1 });

      await request(server).delete('/pizza/delete/1').expect(200, { raw: [], affected: 1 });
    });

    it('responds 404 for an unknown pizza', async () => {
      pizzaRepository.findOne.mockResolvedValue(null);

      await request(server).delete('/pizza/delete/1').expect(404);
    });
  });
});
