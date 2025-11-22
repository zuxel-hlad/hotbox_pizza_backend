import { TokenResponseDto } from '@app/token/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be more than 8 characters long.' })
  @ApiProperty()
  @IsString()
  readonly password: string;
}

export class LoginRequestDto {
  @ApiProperty()
  user: LoginDto;
}

export class LoginResponseDto extends TokenResponseDto {}
