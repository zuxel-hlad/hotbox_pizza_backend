import { validationsSettings } from '@common/constants/validation.constants';
import { User } from '@common/decorators/user.decorator';
import { AuthGuard } from '@core/guards/auth.guard';
import { AuthService } from '@modules/auth/auth.service';
import { ChangePasswordDto, ChangePasswordRequestDto } from '@modules/auth/dto/change-password.dto';
import { LoginDto, LoginRequestDto } from '@modules/auth/dto/login.dto';
import { RegisterDto, RegisterRequestDto } from '@modules/auth/dto/register.dto';
import { ResetPasswordDto, ResetPasswordResponseDto } from '@modules/auth/dto/reset-password.dto';
import { VerifyResetPasswordDto } from '@modules/auth/dto/verify-reset-password.dto';
import { AuthResponse } from '@modules/auth/types/auth-response.interface';
import { ResetPasswordCodeResponse } from '@modules/auth/types/reset-password-code-response.interface';
import { TokenResponseDto } from '@modules/token/dto/token-response.dto';
import { Body, Controller, HttpStatus, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiBody({ type: RegisterRequestDto })
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: HttpStatus.OK, type: TokenResponseDto })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation errors',
    schema: {
      example: {
        statusCode: 422,
        message: ['Email has been taken', 'Username has been taken'],
        error: 'Unprocessable Entity',
      },
    },
  })
  async register(@Body('user') registerDto: RegisterDto): Promise<AuthResponse> {
    const newUser = await this.authService.register(registerDto);

    return this.authService.buildAuthResponse(newUser);
  }

  @Post('login')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({ status: HttpStatus.OK, type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Invalid credentials' })
  @ApiOperation({ summary: 'Login user' })
  async login(@Body('user') LoginDto: LoginDto): Promise<AuthResponse> {
    const loggedUser = await this.authService.login(LoginDto);

    return this.authService.buildAuthResponse(loggedUser);
  }

  @Put('password/change')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiSecurity('Token')
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiResponse({ status: HttpStatus.OK, type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Validation errors',
    schema: {
      example: {
        statusCode: 422,
        message: ['Old password and new password are the same', 'Old password is incorrect'],
        error: 'Invalid credentials',
      },
    },
  })
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Body('password') password: ChangePasswordDto,
    @User('id') userId: number,
  ): Promise<AuthResponse> {
    const user = await this.authService.changePassword(password, userId);

    return this.authService.buildAuthResponse(user);
  }

  @Post('password/reset/send-otp')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiResponse({ status: HttpStatus.OK, type: ResetPasswordResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({
    schema: {
      example: {
        message: 'The email "example-email@gmail.com" not found. Incorrect email',
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      },
    },
  })
  @ApiOperation({ summary: 'Reset user password' })
  async sendResetPasswordCode(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordCodeResponse> {
    return this.authService.sendResetPasswordCode(resetPasswordDto);
  }

  @Post('password/reset/verify-otp')
  @UsePipes(new ValidationPipe(validationsSettings))
  @ApiResponse({ status: HttpStatus.OK, type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({
    schema: {
      example: {
        statusCode: 422,
        message: ['The email "example-email@gmail.com" not found. Incorrect email', 'Invalid otp code'],
      },
    },
  })
  @ApiOperation({ summary: 'Verify reset password code' })
  async verifyResetPasswordCode(@Body() verifyResetPasswordDto: VerifyResetPasswordDto): Promise<AuthResponse> {
    const user = await this.authService.verifyResetPasswordCode(verifyResetPasswordDto);
    return this.authService.buildAuthResponse(user);
  }
}
