import { Admin } from '@common/decorators/admin.decorator';
import { User } from '@common/decorators/user.decorator';
import { toApiSchema } from '@common/helpers/api-schema.helper';
import { AuthGuard } from '@core/guards/auth.guard';
import { AdminEntity } from '@modules/admin/admin.entity';
import { AuthService } from '@modules/auth/auth.service';
import { type ChangePasswordDto, changePasswordSchema } from '@modules/auth/dto/change-password.dto';
import { type LoginDto, loginSchema } from '@modules/auth/dto/login.dto';
import { type RegisterDto, registerSchema } from '@modules/auth/dto/register.dto';
import {
  type ResetPasswordDto,
  resetPasswordResponseSchema,
  resetPasswordSchema,
} from '@modules/auth/dto/reset-password.dto';
import { type VerifyResetPasswordDto, verifyResetPasswordSchema } from '@modules/auth/dto/verify-reset-password.dto';
import { AuthResponse } from '@modules/auth/types/auth-response.interface';
import { ResetPasswordCodeResponse } from '@modules/auth/types/reset-password-code-response.interface';
import { tokenResponseSchema } from '@modules/token/dto/token-response.dto';
import { UserEntity } from '@modules/user/user.entity';
import { Body, Controller, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({ schema: toApiSchema(z.object({ user: registerSchema })) })
  @ApiOperation({ summary: 'Register new client or admin' })
  @ApiResponse({ status: HttpStatus.OK, standardSchema: tokenResponseSchema })
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
  async register(@Body('user', { schema: registerSchema }) registerDto: RegisterDto): Promise<AuthResponse> {
    const account = await this.authService.register(registerDto);

    return this.authService.buildAuthResponse(account);
  }

  @Post('login')
  @ApiBody({ schema: toApiSchema(z.object({ user: loginSchema })) })
  @ApiResponse({ status: HttpStatus.OK, standardSchema: tokenResponseSchema })
  @ApiResponse({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: 'Invalid credentials' })
  @ApiOperation({ summary: 'Login user' })
  async login(@Body('user', { schema: loginSchema }) loginDto: LoginDto): Promise<AuthResponse> {
    const loggedUser = await this.authService.login(loginDto);

    return this.authService.buildAuthResponse(loggedUser);
  }

  @Put('password/change')
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiBody({ schema: toApiSchema(z.object({ password: changePasswordSchema })) })
  @ApiResponse({ status: HttpStatus.OK, standardSchema: tokenResponseSchema })
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
    @Body('password', { schema: changePasswordSchema }) password: ChangePasswordDto,
    @User() user: UserEntity,
    @Admin() admin: AdminEntity,
  ): Promise<AuthResponse> {
    const account = await this.authService.changePassword(password, admin ?? user);

    return this.authService.buildAuthResponse(account);
  }

  @Post('password/reset/send-otp')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: resetPasswordResponseSchema })
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
  async sendResetPasswordCode(
    @Body({ schema: resetPasswordSchema }) resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordCodeResponse> {
    return this.authService.sendResetPasswordCode(resetPasswordDto);
  }

  @Post('password/reset/verify-otp')
  @ApiResponse({ status: HttpStatus.OK, standardSchema: tokenResponseSchema })
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
  async verifyResetPasswordCode(
    @Body({ schema: verifyResetPasswordSchema }) verifyResetPasswordDto: VerifyResetPasswordDto,
  ): Promise<AuthResponse> {
    const user = await this.authService.verifyResetPasswordCode(verifyResetPasswordDto);
    return this.authService.buildAuthResponse(user);
  }
}
