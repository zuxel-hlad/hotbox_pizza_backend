import { Admin } from '@common/decorators/admin.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { User } from '@common/decorators/user.decorator';
import { toApiSchema } from '@common/helpers/api-schema.helper';
import { Role } from '@common/types/role.enum';
import { AuthGuard } from '@core/guards/auth.guard';
import { AdminEntity } from '@modules/admin/admin.entity';
import { AuthService } from '@modules/auth/auth.service';
import type { AuthResponse } from '@modules/auth/types/auth-response.interface';
import { tokenResponseSchema } from '@modules/token/dto/token-response.dto';
import { type UpdateUserDto, updateUserSchema } from '@modules/user/dto/update-user.dto';
import { type UserResponseDto, userResponseSchema } from '@modules/user/dto/user-response.dto';
import { UserEntity } from '@modules/user/user.entity';
import { UserService } from '@modules/user/user.service';
import { Body, Controller, Get, HttpStatus, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

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
  @ApiResponse({ status: HttpStatus.OK, standardSchema: userResponseSchema })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized' })
  getLoggedUser(@User() user: UserEntity, @Admin() admin: AdminEntity): UserResponseDto {
    return this.userService.buildUserResponse(admin ?? user);
  }

  @Put('update')
  @Roles([Role.CLIENT])
  @ApiBody({ schema: toApiSchema(z.object({ user: updateUserSchema })) })
  @ApiOperation({ summary: 'Update logged user' })
  @ApiResponse({ status: HttpStatus.OK, standardSchema: tokenResponseSchema })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
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
  async updateLoggedUser(
    @User('id') userId: number,
    @Body('user', { schema: updateUserSchema }) updateUserDto: UpdateUserDto,
  ): Promise<AuthResponse> {
    const updatedUser = await this.userService.updateLoggedUser(userId, updateUserDto);

    return this.authService.buildAuthResponse(updatedUser);
  }
}
