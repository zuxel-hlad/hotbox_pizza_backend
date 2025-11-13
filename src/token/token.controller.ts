import { AuthService } from '@app/auth/auth.service';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL } from '@app/constants';
import { TokenService } from '@app/token/token.service';
import { TokenInterface } from '@app/token/types/token.interface';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TokenRenewRequestDto, TokenRenewResponseDto } from './dto/token.response.dto';

@ApiTags('Token Resource')
@Controller('token')
export class TokenController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('renew')
  @ApiBody({ type: TokenRenewRequestDto })
  @ApiOperation({ summary: 'Renew access token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OK', type: TokenRenewResponseDto })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    schema: { example: { statusCode: 404, message: 'Not found' } },
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation errors',
    schema: {
      example: {
        statusCode: 422,
        message: ['Refresh token expired', 'Invalid refresh token', 'Unable to verify refresh token'],
        error: 'Unprocessable Entity',
      },
    },
  })
  async renewToken(@Body('token') { token }: TokenRenewRequestDto): Promise<TokenInterface> {
    const user = await this.tokenService.renewToken(token);
    return {
      token: this.authService.generateJwt(user, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL),
      expiresIn: ACCESS_TOKEN_TTL,
    };
  }
}
