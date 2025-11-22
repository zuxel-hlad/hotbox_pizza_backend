import { TokenResponseDto } from '@app/token/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  readonly email: string;

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  readonly username: string;

  @IsNotEmpty()
  @ApiProperty()
  @MinLength(8, { message: 'Password must be more than 8 characters long.' })
  @IsString()
  readonly password: string;
}

export class RegisterRequestDto {
  @ApiProperty()
  user: RegisterDto;
}

export class RegisterResponseDto extends TokenResponseDto {}
