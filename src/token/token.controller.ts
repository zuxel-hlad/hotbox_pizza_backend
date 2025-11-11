import { AuthService } from '@app/auth/auth.service';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL } from '@app/constants';
import { TokenService } from '@app/token/token.service';
import { TokenInterface } from '@app/token/types/token.interface';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('token')
export class TokenController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('renew')
  async renewToken(@Body('token') token: string): Promise<TokenInterface> {
    const user = await this.tokenService.renewToken(token);
    return {
      token: this.authService.generateJwt(user, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL),
      expiresIn: ACCESS_TOKEN_TTL,
    };
  }
}
