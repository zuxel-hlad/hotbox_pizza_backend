import { TokenInterface } from '@app/token/types/token.interface';

export interface AuthResponseInterface {
  access: TokenInterface;
  refresh: TokenInterface;
}
