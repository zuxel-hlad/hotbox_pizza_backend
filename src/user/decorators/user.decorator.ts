import type { ExpressRequest } from '@app/user/types/express.request.interface';
import { UserEntity } from '@app/user/user.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  <K extends keyof UserEntity>(data: K | undefined, ctx: ExecutionContext): UserEntity | UserEntity[K] | null => {
    const request = ctx.switchToHttp().getRequest<ExpressRequest>();

    if (!request.user) {
      return null;
    }

    if (data) {
      return request.user[data];
    }

    return request.user;
  },
);
