import type { ExpressRequest } from '@common/types/express-request.interface';
import { AdminEntity } from '@modules/admin/admin.entity';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Admin = createParamDecorator(
  <K extends keyof AdminEntity>(data: K | undefined, ctx: ExecutionContext): AdminEntity | AdminEntity[K] | null => {
    const { admin } = ctx.switchToHttp().getRequest<ExpressRequest>();

    return data ? admin?.[data] : admin;
  },
);
