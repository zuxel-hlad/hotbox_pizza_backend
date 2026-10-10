import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class TokenDto {
  @ApiProperty()
  readonly token: string;

  @ApiProperty()
  readonly expiresIn: number;
}

export class TokenRenewRequestDto {
  @IsJWT()
  @ApiProperty()
  readonly token: string;
}

export class TokenResponseDto {
  @ApiProperty()
  readonly access: TokenDto;
  @ApiProperty()
  readonly refresh: TokenDto;
}
