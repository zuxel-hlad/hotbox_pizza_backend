import { TokenResponseDto } from '@app/token/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be more than 8 characters long.' })
  @ApiProperty()
  @IsString()
  readonly oldPassword: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be more than 8 characters long.' })
  @ApiProperty()
  @IsString()
  readonly newPassword: string;
}

export class ChangePasswordRequestDto {
  @ApiProperty()
  password: ChangePasswordDto;
}

export class ChangePasswordResponseDto extends TokenResponseDto {}
