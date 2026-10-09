import { Token } from '@modules/token/types/token.interface';

export interface AuthResponse {
  access: Token;
  refresh: Token;
}
