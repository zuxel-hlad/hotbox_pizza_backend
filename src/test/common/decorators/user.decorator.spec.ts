import { User } from '@common/decorators/user.decorator';
import { UserEntity } from '@modules/user/user.entity';
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

type UserFactory = (data: keyof UserEntity | undefined, context: ExecutionContext) => unknown;

const getUserFactory = (): UserFactory => {
  class TestController {
    handle(@User() user: UserEntity) {
      return user;
    }
  }

  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handle') as Record<
    string,
    { factory: UserFactory }
  >;

  return Object.values(metadata)[0].factory;
};

const createContext = (user?: Partial<UserEntity>) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

describe('User decorator', () => {
  const factory = getUserFactory();
  const user = { id: 7, email: 'john@x.com' };

  it('returns null when the request has no user', () => {
    expect(factory(undefined, createContext())).toBeNull();
  });

  it('returns the whole user without a key', () => {
    expect(factory(undefined, createContext(user))).toBe(user);
  });

  it('returns the requested user field', () => {
    expect(factory('id', createContext(user))).toBe(7);
  });
});
