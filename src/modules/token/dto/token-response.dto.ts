import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNumber } from 'class-validator';

export class TokenDto {
  @ApiProperty()
  @IsJWT()
  readonly token: string;

  @ApiProperty()
  @IsNumber()
  readonly expiresIn: number;
}

export class TokenRenewRequestDto {
  @IsJWT()
  @ApiProperty()
  readonly token: string;
}

export class TokenRenewResponseDto {
  @IsJWT()
  @ApiProperty()
  readonly token: TokenDto;
}

export class TokenResponseDto {
  @ApiProperty()
  readonly access: TokenDto;
  @ApiProperty()
  readonly refresh: TokenDto;
}
