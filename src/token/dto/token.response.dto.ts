import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class TokenDto {
  @ApiProperty()
  @IsString()
  readonly token: string;

  @ApiProperty()
  @IsNumber()
  readonly expiresIn: number;
}

export class TokenRenewRequestDto {
  @ApiProperty()
  readonly token: string;
}

export class TokenRenewResponseDto {
  @ApiProperty()
  readonly token: TokenDto;
}

export class TokenResponseDto {
  @ApiProperty()
  readonly access: TokenDto;
  @ApiProperty()
  readonly refresh: TokenDto;
}
