import { validationsSettings } from '@common/constants/validation.constants';
import { AuthService } from '@modules/auth/auth.service';
import { TokenDto, TokenRenewRequestDto } from '@modules/token/dto/token-response.dto';
import { Token } from '@modules/token/types/token.interface';
import { Body, Controller, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Token Resource')
@Controller('token')
export class TokenController {
  constructor(private readonly authService: AuthService) {}

  @Post('renew')
  @ApiBody({ type: TokenRenewRequestDto })
  @ApiOperation({ summary: 'Renew access token' })
  @ApiResponse({ status: HttpStatus.OK, type: TokenDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token expired, invalid or revoked',
    schema: { example: { statusCode: 401, message: 'Invalid refresh token', error: 'Unauthorized' } },
  })
  @UsePipes(new ValidationPipe(validationsSettings))
  async renewToken(@Body() tokenDto: TokenRenewRequestDto): Promise<Token> {
    return await this.authService.renewAccessToken(tokenDto.token);
  }
}
