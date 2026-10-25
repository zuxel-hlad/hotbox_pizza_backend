import { Role } from '@common/types/role.enum';
import { AuthGuard } from '@core/guards/auth.guard';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const createContext = (request: { user?: object | null; admin?: object | null }) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => null,
    getClass: () => null,
  }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new AuthGuard(reflector as unknown as Reflector);

  beforeEach(() => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
  });

  it('allows a request with a user', () => {
    expect(guard.canActivate(createContext({ user: { id: 1 } }))).toBe(true);
  });

  it('allows a request with an admin', () => {
    expect(guard.canActivate(createContext({ admin: { id: 1 } }))).toBe(true);
  });

  it.each<object | null | undefined>([undefined, null])('rejects a request with user = %p', (user) => {
    expect(() => guard.canActivate(createContext({ user }))).toThrow(
      new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED),
    );
  });

  it('allows an admin on an admin route', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(createContext({ admin: { id: 1 } }))).toBe(true);
  });

  it('rejects a client on an admin route', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(() => guard.canActivate(createContext({ user: { id: 1 } }))).toThrow(
      new HttpException('Forbidden.', HttpStatus.FORBIDDEN),
    );
  });

  it('rejects an admin on a client route', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.CLIENT]);

    expect(() => guard.canActivate(createContext({ admin: { id: 1 } }))).toThrow(
      new HttpException('Forbidden.', HttpStatus.FORBIDDEN),
    );
  });
});
