import { AuthResponse } from '@modules/auth/types/auth-response.interface';
import { UserEntity } from '@modules/user/user.entity';
import { RepositoryMock } from '@test/helpers/repository.mock';
import { createAuthHeader, createTestApp, TestApp } from '@test/helpers/test-app.helper';
import request from 'supertest';
import { App } from 'supertest/types';

describe('User (e2e)', () => {
  const user = { id: 1, email: 'john@x.com', username: 'john', tokenVersion: 0, password: 'hash', bonuses: 150 };
  const authHeader = createAuthHeader(user);
  let testApp: TestApp;
  let server: App;
  let userRepository: RepositoryMock;

  beforeAll(async () => {
    testApp = await createTestApp();
    server = testApp.app.getHttpServer();
  });

  beforeEach(() => {
    testApp.resetMocks();
    userRepository = testApp.repository(UserEntity);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('GET /user/me', () => {
    it('requires authorization', async () => {
      await request(server).get('/user/me').expect(401);
    });

    it('rejects a token of an outdated version', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await request(server).get('/user/me').set('Authorization', authHeader).expect(401);
    });

    it('returns the logged user without secrets', async () => {
      userRepository.findOne.mockResolvedValue({ ...user });

      const response = await request(server).get('/user/me').set('Authorization', authHeader).expect(200);

      expect(response.body).toEqual({ user: { id: 1, email: 'john@x.com', username: 'john', bonuses: 150 } });
    });
  });

  describe('PUT /user/update', () => {
    it('requires authorization', async () => {
      await request(server)
        .put('/user/update')
        .send({ user: { username: 'johnny' } })
        .expect(401);
    });

    it('updates the user and returns tokens', async () => {
      userRepository.findOne.mockResolvedValueOnce({ ...user }).mockResolvedValueOnce({ ...user });

      const response = await request(server)
        .put('/user/update')
        .set('Authorization', authHeader)
        .send({ user: { email: user.email, username: user.username, phone: '+380501234567' } })
        .expect(200);

      expect((response.body as AuthResponse).access.token).toEqual(expect.any(String));
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ phone: '+380501234567' }));
    });

    it('rejects an invalid phone', async () => {
      userRepository.findOne.mockResolvedValue({ ...user });

      await request(server)
        .put('/user/update')
        .set('Authorization', authHeader)
        .send({ user: { phone: '123' } })
        .expect(400);
    });

    it('rejects a taken email', async () => {
      userRepository.findOne
        .mockResolvedValueOnce({ ...user })
        .mockResolvedValueOnce({ ...user })
        .mockResolvedValueOnce({ id: 2 });

      const response = await request(server)
        .put('/user/update')
        .set('Authorization', authHeader)
        .send({ user: { email: 'taken@x.com', username: user.username } })
        .expect(422);

      expect(response.body).toMatchObject({ message: 'Email has been taken' });
    });
  });
});
