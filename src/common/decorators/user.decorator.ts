import type { ExpressRequest } from '@common/types/express-request.interface';
import { UserEntity } from '@modules/user/user.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  <K extends keyof UserEntity>(data: K | undefined, ctx: ExecutionContext): UserEntity | UserEntity[K] | null => {
    const { user } = ctx.switchToHttp().getRequest<ExpressRequest>();

    return data ? user?.[data] : user;
  },
);
