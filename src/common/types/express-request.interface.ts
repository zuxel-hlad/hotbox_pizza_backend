import { AdminEntity } from '@modules/admin/admin.entity';
import { UserEntity } from '@modules/user/user.entity';
import { Request } from 'express';

export interface ExpressRequest extends Request {
  user?: UserEntity;
  admin?: AdminEntity;
}
