import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  birthDate: string;

  @ApiProperty()
  bonuses: number;

  @ApiProperty()
  image: string;

  @ApiProperty()
  phone: string;
}

export class UserResponseDto {
  @ApiProperty({ type: UserResponse })
  user: UserResponse;
}
