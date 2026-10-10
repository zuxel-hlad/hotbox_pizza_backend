import { validationsSettings } from '@common/constants/validation.constants';
import { User } from '@common/decorators/user.decorator';
import { AuthGuard } from '@core/guards/auth.guard';
import { AuthService } from '@modules/auth/auth.service';
import type { AuthResponse } from '@modules/auth/types/auth-response.interface';
import { TokenResponseDto } from '@modules/token/dto/token-response.dto';
import { UpdateUserDto, UpdateUserDtoRequest } from '@modules/user/dto/update-user.dto';
import { UserResponseDto } from '@modules/user/dto/user-response.dto';
import { UserEntity } from '@modules/user/user.entity';
import { UserService } from '@modules/user/user.service';
import { Body, Controller, Get, HttpStatus, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('User Resource')
@ApiSecurity('Token')
@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get logged user' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized' })
  getLoggedUser(@User() user: UserEntity): UserResponseDto {
    return this.userService.buildUserResponse(user);
  }

  @Put('update')
  @UsePipes(new ValidationPipe(validationsSettings))
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
  ): Promise<AuthResponse> {
    const updatedUser = await this.userService.updateLoggedUser(userId, updateUserDto);

    return this.authService.buildAuthResponse(updatedUser);
  }
}
