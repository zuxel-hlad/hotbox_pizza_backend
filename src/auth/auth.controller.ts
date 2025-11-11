import { AuthService } from '@app/auth/auth.service';
import { ChangePasswordDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyResetPasswordDto } from '@app/auth/dto';
import { AuthResponseInterface } from '@app/auth/types/authResponse.interface';
import { ResetPasswordCodeResponseInterface } from '@app/auth/types/resetPasswordCodeResponse.interface';
import { User } from '@app/user/decorators/user.decorator';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { Body, Controller, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe())
  async register(@Body('user') registerDto: RegisterDto): Promise<AuthResponseInterface> {
    const newUser = await this.authService.register(registerDto);

    return this.authService.buildAuthResponse(newUser);
  }

  @Post('login')
  @UsePipes(new ValidationPipe())
  async login(@Body('user') LoginDto: LoginDto): Promise<AuthResponseInterface> {
    const loggedUser = await this.authService.login(LoginDto);

    return this.authService.buildAuthResponse(loggedUser);
  }

  @Put('password/change')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async changePassword(
    @Body('password') password: ChangePasswordDto,
    @User('id') userId: number,
  ): Promise<AuthResponseInterface> {
    const user = await this.authService.changePassword(password, userId);

    return this.authService.buildAuthResponse(user);
  }

  @Post('password/reset/send-otp')
  @UsePipes(new ValidationPipe())
  async sendResetPasswordCode(@Body() resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordCodeResponseInterface> {
    return this.authService.sendResetPasswordCode(resetPasswordDto);
  }

  @Post('password/reset/verify-otp')
  @UsePipes(new ValidationPipe())
  async verifyResetPasswordCode(
    @Body() verifyResetPasswordDto: VerifyResetPasswordDto,
  ): Promise<AuthResponseInterface> {
    const user = await this.authService.verifyResetPasswordCode(verifyResetPasswordDto);
    return this.authService.buildAuthResponse(user);
  }
}
