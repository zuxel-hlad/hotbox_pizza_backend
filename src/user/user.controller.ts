import { AuthService } from '@app/auth/auth.service';
import type { AuthResponseInterface } from '@app/auth/types/authResponse.interface';
import { TokenResponseDto } from '@app/token/dto';
import { User } from '@app/user/decorators/user.decorator';
import { UpdateUserDto, UpdateUserDtoRequest, UserResponseDto } from '@app/user/dto';
import { AuthGuard } from '@app/user/guards/auth.guard';
import type { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';
import { Body, Controller, Get, HttpStatus, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
@ApiTags('User Resource')
@ApiSecurity('Token')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get logged user' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  getLoggedUser(@User() user: UserEntity): UserResponseInterface {
    return this.userService.buildUserResponse(user);
  }

  @Put('update')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Update logged user' })
  @ApiResponse({ status: HttpStatus.OK, type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized' })
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
  @ApiBody({ type: UpdateUserDtoRequest })
  async updateLoggedUser(
    @User('id') userId: number,
    @Body('user') updateUserDto: UpdateUserDto,
  ): Promise<AuthResponseInterface> {
    const updatedUser = await this.userService.updateLoggedUser(userId, updateUserDto);

    return this.authService.buildAuthResponse(updatedUser);
  }
}
