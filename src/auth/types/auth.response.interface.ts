import { Token } from '@app/token/types/token.interface';

export interface AuthResponse {
  access: Token;
  refresh: Token;
}
