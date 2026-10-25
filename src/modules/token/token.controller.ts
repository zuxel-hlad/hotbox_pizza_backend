import { AuthService } from '@modules/auth/auth.service';
import { type TokenRenewRequestDto, tokenRenewRequestSchema, tokenSchema } from '@modules/token/dto/token-response.dto';
import { Token } from '@modules/token/types/token.interface';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Token Resource')
@Controller('token')
export class TokenController {
  constructor(private readonly authService: AuthService) {}

  @Post('renew')
  @ApiOperation({ summary: 'Renew access token' })
  @ApiResponse({ status: HttpStatus.OK, standardSchema: tokenSchema })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token expired, invalid or revoked',
    schema: { example: { statusCode: 401, message: 'Invalid refresh token', error: 'Unauthorized' } },
  })
  async renewToken(@Body({ schema: tokenRenewRequestSchema }) tokenDto: TokenRenewRequestDto): Promise<Token> {
    return await this.authService.renewAccessToken(tokenDto.token);
  }
}
