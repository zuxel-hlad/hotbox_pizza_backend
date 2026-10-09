import { validationsSettings } from '@common/constants/validation.constants';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL } from '@core/config/jwt.config';
import { AuthService } from '@modules/auth/auth.service';
import { TokenRenewRequestDto, TokenRenewResponseDto } from '@modules/token/dto/token-response.dto';
import { TokenService } from '@modules/token/token.service';
import { Token } from '@modules/token/types/token.interface';
import { Body, Controller, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

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
  @ApiResponse({ status: HttpStatus.OK, type: TokenRenewResponseDto })
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
  @UsePipes(new ValidationPipe(validationsSettings))
  async renewToken(@Body() tokenDto: TokenRenewRequestDto): Promise<Token> {
    const user = await this.tokenService.renewToken(tokenDto.token);
    return this.authService.buildToken(user, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL);
  }
}
