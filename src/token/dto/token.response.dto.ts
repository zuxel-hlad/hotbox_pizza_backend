import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  expiresIn: number;
}

export class TokenRenewRequestDto {
  @ApiProperty()
  token: string;
}

export class TokenRenewResponseDto {
  @ApiProperty()
  token: TokenDto;
}

export class TokenResponseDto {
  @ApiProperty()
  access: TokenDto;
  @ApiProperty()
  refresh: TokenDto;
}
