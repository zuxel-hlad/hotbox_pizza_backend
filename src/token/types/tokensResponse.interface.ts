import { TokenInterface } from '@app/token/types/token.interface';

export interface TokensResponseInterface {
  access: TokenInterface;
  refresh: TokenInterface;
}
