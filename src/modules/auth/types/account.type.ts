import { AdminEntity } from '@modules/admin/admin.entity';
import { UserEntity } from '@modules/user/user.entity';

export type Account = UserEntity | AdminEntity;
