import { Roles } from '@common/decorators/roles.decorator';
import type { ExpressRequest } from '@common/types/express-request.interface';
import { Role } from '@common/types/role.enum';
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ExpressRequest>();

    if (!request.user && !request.admin) {
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }

    const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);
    const role = request.admin ? Role.ADMIN : Role.CLIENT;
    const hasRole = !roles || roles.includes(role);

    if (!hasRole) {
      throw new HttpException('Forbidden.', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
