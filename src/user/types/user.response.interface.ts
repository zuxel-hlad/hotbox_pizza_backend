import { UserEntity } from '@app/user/user.entity';

export interface UserResponse {
  user: Omit<UserEntity, 'hashPassword' | 'password'>;
}
