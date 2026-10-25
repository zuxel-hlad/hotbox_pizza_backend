import type { ExpressRequest } from '@common/types/express-request.interface';
import { Role } from '@common/types/role.enum';
import { ACCESS_TOKEN_SECRET } from '@core/config/jwt.config';
import { AdminService } from '@modules/admin/admin.service';
import { TokenPayload } from '@modules/token/types/token-payload.interface';
import { UserService } from '@modules/user/user.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private readonly adminService: AdminService,
  ) {}

  async use(req: ExpressRequest, _res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const { tokenVersion, email, username, id, role } = verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;

      if (role === Role.ADMIN) {
        req.admin = await this.adminService.findOne({ id, tokenVersion });
      } else {
        req.user = await this.userService.findCurrentUser({ id, tokenVersion, username, email });
      }
    } catch {
      req.user = null;
      req.admin = null;
    }

    next();
  }
}
