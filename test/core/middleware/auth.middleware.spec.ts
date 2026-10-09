import type { ExpressRequest } from '@common/types/express-request.interface';
import { ACCESS_TOKEN_SECRET } from '@core/config/jwt.config';
import { AuthMiddleware } from '@core/middleware/auth.middleware';
import { UserEntity } from '@modules/user/user.entity';
import { UserService } from '@modules/user/user.service';
import { Response } from 'express';
import { sign } from 'jsonwebtoken';

describe('AuthMiddleware', () => {
  const payload = { id: 7, email: 'john@x.com', username: 'john', tokenVersion: 2 };
  const user = { ...payload, bonuses: 150 } as UserEntity;
  const findCurrentUser = jest.fn();
  const middleware = new AuthMiddleware({ findCurrentUser } as unknown as UserService);
  const next = jest.fn();

  const run = async (authorization?: string) => {
    const request = { headers: { authorization } } as ExpressRequest;
    await middleware.use(request, {} as Response, next);
    return request;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets user to null without an authorization header', async () => {
    const request = await run();

    expect(request.user).toBeNull();
    expect(findCurrentUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('loads the user from a valid token', async () => {
    findCurrentUser.mockResolvedValue(user);

    const request = await run(`Token ${sign(payload, ACCESS_TOKEN_SECRET)}`);

    expect(findCurrentUser).toHaveBeenCalledWith(payload);
    expect(request.user).toBe(user);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['an invalid token', 'Token invalid'],
    ['a token signed with another secret', `Token ${sign(payload, 'another-secret')}`],
    ['an expired token', `Token ${sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: -1 })}`],
    ['a header without a token', 'Token'],
  ])('sets user to null for %s', async (_case, authorization) => {
    const request = await run(authorization);

    expect(request.user).toBeNull();
    expect(findCurrentUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets user to null when the user lookup fails', async () => {
    findCurrentUser.mockRejectedValue(new Error('Database error'));

    const request = await run(`Token ${sign(payload, ACCESS_TOKEN_SECRET)}`);

    expect(request.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
