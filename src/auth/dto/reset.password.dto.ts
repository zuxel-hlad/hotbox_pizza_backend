import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}

export class ResetPasswordRequestDto extends ResetPasswordDto {}
export class ResetPasswordResponseDto {
  @ApiProperty({ example: 'Reset password code sent to st**********n@gmail.com' })
  readonly message: string;

  @ApiProperty({ example: 200 })
  readonly statusCode: string;
}
