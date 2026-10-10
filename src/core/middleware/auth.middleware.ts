import type { ExpressRequest } from '@common/types/express-request.interface';
import { ACCESS_TOKEN_SECRET } from '@core/config/jwt.config';
import { UserEntity } from '@modules/user/user.entity';
import { UserService } from '@modules/user/user.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: ExpressRequest, _res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const { tokenVersion, email, username, id } = verify(token, ACCESS_TOKEN_SECRET) as UserEntity;
      req.user = await this.userService.findCurrentUser({ id, tokenVersion, username, email });
    } catch {
      req.user = null;
    }

    next();
  }
}
