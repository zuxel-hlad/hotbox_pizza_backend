import { AuthResponse } from '@modules/auth/types/auth-response.interface';
import { UserEntity } from '@modules/user/user.entity';
import { RepositoryMock } from '@test/helpers/repository.mock';
import { createAuthHeader, createTestApp, TestApp } from '@test/helpers/test-app.helper';
import { hash } from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Auth (e2e)', () => {
  const password = 'password123';
  const user = { id: 1, email: 'john@x.com', username: 'john', tokenVersion: 0, password: '' };
  let testApp: TestApp;
  let server: App;
  let userRepository: RepositoryMock;

  const expectTokens = (body: AuthResponse) => {
    expect(body.access).toEqual({ token: expect.any(String) as string, expiresIn: 3600 });
    expect(body.refresh).toEqual({ token: expect.any(String) as string, expiresIn: 31536000 });
  };

  beforeAll(async () => {
    testApp = await createTestApp();
    server = testApp.app.getHttpServer();
    user.password = await hash(password, 4);
  });

  beforeEach(() => {
    testApp.resetMocks();
    userRepository = testApp.repository(UserEntity);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('POST /auth/register', () => {
    const newUser = { email: 'john@x.com', username: 'john', password };

    it('registers a user and returns tokens', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.save.mockImplementation((entity: UserEntity) => Promise.resolve({ ...entity, id: 1 }));

      const response = await request(server).post('/auth/register').send({ user: newUser }).expect(201);

      expectTokens(response.body as AuthResponse);
    });

    it('rejects invalid fields', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({ user: { email: 'not-an-email', username: 'john', password: 'short', role: 'admin' } })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          'property role should not exist',
          'email must be an email',
          'Password must be more than 8 characters long.',
        ]) as string[],
      });
    });

    it('rejects a taken email', async () => {
      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(null);

      const response = await request(server).post('/auth/register').send({ user: newUser }).expect(422);

      expect(response.body).toMatchObject({ message: 'Email has been taken' });
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(user);

      const response = await request(server)
        .post('/auth/login')
        .send({ user: { email: user.email, password } })
        .expect(201);

      expectTokens(response.body as AuthResponse);
    });

    it('rejects a wrong password', async () => {
      userRepository.findOne.mockResolvedValue(user);

      const response = await request(server)
        .post('/auth/login')
        .send({ user: { email: user.email, password: 'wrong-password' } })
        .expect(422);

      expect(response.body).toMatchObject({ message: 'Invalid credentials' });
    });
  });

  describe('PUT /auth/password/change', () => {
    const passwords = { oldPassword: password, newPassword: 'new-password123' };

    it('requires authorization', async () => {
      const response = await request(server).put('/auth/password/change').send({ password: passwords }).expect(401);

      expect(response.body).toMatchObject({ message: 'Not authorized.' });
    });

    it('changes the password and invalidates old tokens', async () => {
      userRepository.findOne.mockResolvedValue({ ...user });

      const response = await request(server)
        .put('/auth/password/change')
        .set('Authorization', createAuthHeader(user))
        .send({ password: passwords })
        .expect(200);

      expectTokens(response.body as AuthResponse);
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ tokenVersion: 1 }));
    });
  });

  describe('password reset', () => {
    it('sends a code and resets the password with it', async () => {
      userRepository.findOne.mockResolvedValue({ ...user });

      const sendResponse = await request(server)
        .post('/auth/password/reset/send-otp')
        .send({ email: user.email })
        .expect(201);
      const [, code] = testApp.mailService.sendResetCode.mock.calls[0] as [string, string];

      expect(sendResponse.body).toEqual({ message: 'Reset password code sent to jo*n@x.com', statusCode: 200 });

      const verifyResponse = await request(server)
        .post('/auth/password/reset/verify-otp')
        .send({ email: user.email, code, password: 'new-password123' })
        .expect(201);

      expectTokens(verifyResponse.body as AuthResponse);
    });

    it('rejects an unknown email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await request(server).post('/auth/password/reset/send-otp').send({ email: 'nobody@x.com' }).expect(422);
      expect(testApp.mailService.sendResetCode).not.toHaveBeenCalled();
    });

    it('rejects a wrong code', async () => {
      const response = await request(server)
        .post('/auth/password/reset/verify-otp')
        .send({ email: user.email, code: 'wrong', password: 'new-password123' })
        .expect(422);

      expect(response.body).toMatchObject({ message: 'Invalid otp code' });
    });
  });
});
