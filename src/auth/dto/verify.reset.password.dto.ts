import { TokenResponseDto } from '@app/token/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class VerifyResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  readonly email: string;

  @IsNotEmpty()
  @ApiProperty()
  readonly code: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be more than 8 characters long.' })
  @ApiProperty()
  readonly password: string;
}

export class VerifyResetPasswordRequestDto extends VerifyResetPasswordDto {}
export class VerifyResetPasswordResponseDto extends TokenResponseDto {}
