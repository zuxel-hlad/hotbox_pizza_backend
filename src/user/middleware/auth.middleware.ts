import { ACCESS_TOKEN_SECRET } from '@app/constants';
import type { ExpressRequest } from '@app/user/types/express.request.interface';
import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: ExpressRequest, _res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }

    const token = req.headers.authorization.split(' ')[1];

    try {
      const { tokenVersion, email, username, id } = verify(token, ACCESS_TOKEN_SECRET) as UserEntity;
      const user = await this.userService.findCurrentUser({ id, tokenVersion, username, email });
      req.user = user;
      next();
    } catch {
      req.user = null;
      next();
    }
  }
}
