import { ExtraIngredientEntity } from '@modules/extra-ingredient/extra-ingredient.entity';
import { UserEntity } from '@modules/user/user.entity';
import { RepositoryMock } from '@test/helpers/repository.mock';
import { createAuthHeader, createTestApp, TestApp } from '@test/helpers/test-app.helper';
import request from 'supertest';
import { App } from 'supertest/types';

describe('ExtraIngredient (e2e)', () => {
  const user = { id: 1, email: 'john@x.com', username: 'john', tokenVersion: 0 };
  const authHeader = createAuthHeader(user);
  const newIngredient = { nameEn: 'Cheese', nameUa: 'Сир', calories: 120, price: 30 };
  const ingredient = { id: 1, ...newIngredient };
  let testApp: TestApp;
  let server: App;
  let ingredientRepository: RepositoryMock;

  const authorize = () => testApp.repository(UserEntity).findOne.mockResolvedValueOnce(user);

  beforeAll(async () => {
    testApp = await createTestApp();
    server = testApp.app.getHttpServer();
  });

  beforeEach(() => {
    testApp.resetMocks();
    ingredientRepository = testApp.repository(ExtraIngredientEntity);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('GET /extra-ingredient/find-all returns all ingredients', async () => {
    ingredientRepository.find.mockResolvedValue([ingredient]);

    await request(server).get('/extra-ingredient/find-all').expect(200, [ingredient]);
  });

  describe('POST /extra-ingredient/create', () => {
    it('creates an ingredient without authorization (known gap)', async () => {
      ingredientRepository.existsBy.mockResolvedValue(false);

      await request(server).post('/extra-ingredient/create').send(newIngredient).expect(201, newIngredient);
    });

    it('rejects a duplicate', async () => {
      ingredientRepository.existsBy.mockResolvedValue(true);

      const response = await request(server).post('/extra-ingredient/create').send(newIngredient).expect(400);

      expect(response.body).toMatchObject({ message: 'Extra ingredient already exist.' });
    });

    it('rejects a non-numeric price', async () => {
      await request(server)
        .post('/extra-ingredient/create')
        .send({ ...newIngredient, price: '30' })
        .expect(400);
    });
  });

  describe('PUT /extra-ingredient/update/:id', () => {
    it('requires authorization', async () => {
      await request(server).put('/extra-ingredient/update/1').send({ price: 40 }).expect(401);
    });

    it('updates an ingredient', async () => {
      authorize();
      ingredientRepository.findOne.mockResolvedValue({ ...ingredient });

      await request(server)
        .put('/extra-ingredient/update/1')
        .set('Authorization', authHeader)
        .send({ price: 40 })
        .expect(200, { ...ingredient, price: 40 });
    });

    it('responds 404 for an unknown ingredient', async () => {
      authorize();
      ingredientRepository.findOne.mockResolvedValue(null);

      await request(server)
        .put('/extra-ingredient/update/1')
        .set('Authorization', authHeader)
        .send({ price: 40 })
        .expect(404);
    });
  });

  describe('DELETE /extra-ingredient/delete/:id', () => {
    it('requires authorization', async () => {
      await request(server).delete('/extra-ingredient/delete/1').expect(401);
    });

    it('deletes an ingredient', async () => {
      authorize();
      ingredientRepository.delete.mockResolvedValue({ raw: [], affected: 1 });

      await request(server)
        .delete('/extra-ingredient/delete/1')
        .set('Authorization', authHeader)
        .expect(200, { raw: [], affected: 1 });
    });

    it('responds 404 for an unknown ingredient', async () => {
      authorize();
      ingredientRepository.delete.mockResolvedValue({ raw: [], affected: 0 });

      await request(server).delete('/extra-ingredient/delete/1').set('Authorization', authHeader).expect(404);
    });
  });
});
