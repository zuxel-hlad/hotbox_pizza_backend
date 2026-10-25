import { Role } from '@common/types/role.enum';

export interface TokenPayload {
  id: number;
  email: string;
  tokenVersion: number;
  role: Role;
  username?: string;
}
