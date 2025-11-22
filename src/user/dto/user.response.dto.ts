import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly username: string;

  @ApiProperty()
  readonly birthDate: string;

  @ApiProperty()
  readonly bonuses: number;

  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  readonly phone: string;
}

export class UserResponseDto {
  @ApiProperty({ type: UserResponse })
  user: UserResponse;
}
