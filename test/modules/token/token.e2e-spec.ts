import { REFRESH_TOKEN_SECRET } from '@core/config/jwt.config';
import { UserEntity } from '@modules/user/user.entity';
import { createTestApp, TestApp } from '@test/helpers/test-app.helper';
import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Token (e2e)', () => {
  let testApp: TestApp;
  let server: App;

  beforeAll(async () => {
    testApp = await createTestApp();
    server = testApp.app.getHttpServer();
  });

  beforeEach(() => {
    testApp.resetMocks();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('renews the access token', async () => {
    testApp.repository(UserEntity).findOne.mockResolvedValue({ id: 1, email: 'john@x.com', tokenVersion: 0 });

    const response = await request(server)
      .post('/token/renew')
      .send({ token: sign({ id: 1, tokenVersion: 0 }, REFRESH_TOKEN_SECRET) })
      .expect(201);

    expect(response.body).toEqual({ token: expect.any(String) as string, expiresIn: 3600 });
    expect(testApp.repository(UserEntity).findOne).toHaveBeenCalledWith({ where: { id: 1, tokenVersion: 0 } });
  });

  it('rejects a revoked token or an unknown user', async () => {
    testApp.repository(UserEntity).findOne.mockResolvedValue(null);

    const response = await request(server)
      .post('/token/renew')
      .send({ token: sign({ id: 1, tokenVersion: 0 }, REFRESH_TOKEN_SECRET) })
      .expect(401);

    expect(response.body).toMatchObject({ message: 'Invalid refresh token' });
  });

  it('rejects a token signed with another secret', async () => {
    const response = await request(server)
      .post('/token/renew')
      .send({ token: sign({ id: 1 }, 'another-secret') })
      .expect(401);

    expect(response.body).toMatchObject({ message: 'Invalid refresh token' });
  });

  it('rejects a value that is not a JWT', async () => {
    await request(server).post('/token/renew').send({ token: 'not-a-jwt' }).expect(400);
  });
});
