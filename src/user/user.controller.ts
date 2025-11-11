import { AuthService } from '@app/auth/auth.service';
import type { AuthResponseInterface } from '@app/auth/types/authResponse.interface';
import { User } from '@app/user/decorators/user.decorator';
import { UpdateUserDto } from '@app/user/dto';
import { AuthGuard } from '@app/user/guards/auth.guard';
import type { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';
import { Body, Controller, Get, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getLoggedUser(@User() user: UserEntity): UserResponseInterface {
    return this.userService.buildUserResponse(user);
  }

  @Put('update')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async updateLoggedUser(
    @User('id') userId: number,
    @Body('user') updateUserDto: UpdateUserDto,
  ): Promise<AuthResponseInterface> {
    const updatedUser = await this.userService.updateLoggedUser(userId, updateUserDto);

    return this.authService.buildAuthResponse(updatedUser);
  }
}
