import { UserEntity } from '@app/user/user.entity';

export interface ExpressRequestInterface {
  user?: UserEntity;
}
