import { AdminEntity } from '@modules/admin/admin.entity';
import { FindOptionsWhere } from 'typeorm';

export type AccountWhere = Pick<FindOptionsWhere<AdminEntity>, 'id' | 'email' | 'tokenVersion'>;
