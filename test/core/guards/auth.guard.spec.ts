import { AuthGuard } from '@core/guards/auth.guard';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

const createContext = (user?: object | null) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  const guard = new AuthGuard();

  it('allows a request with a user', () => {
    expect(guard.canActivate(createContext({ id: 1 }))).toBe(true);
  });

  it.each<object | null | undefined>([undefined, null])('rejects a request with user = %p', (user) => {
    expect(() => guard.canActivate(createContext(user))).toThrow(
      new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED),
    );
  });
});
