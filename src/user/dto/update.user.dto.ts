import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsOptional, IsPhoneNumber, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @ApiProperty({ required: false })
  readonly email: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  readonly username: string;

  @IsOptional()
  @Transform(({ value }: { value: Date }) => value || undefined)
  @IsDateString()
  @ApiProperty({ required: false })
  readonly birthDate: string;

  @IsOptional()
  @Transform(({ value }: { value: Date }) => value || undefined)
  @IsUrl({ require_protocol: true, require_valid_protocol: true, protocols: ['http', 'https'] })
  @ApiProperty({ required: false })
  readonly image: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => value || undefined)
  @IsPhoneNumber('UA')
  @ApiProperty({ required: false })
  readonly phone: string;
}

export class UpdateUserDtoRequest {
  @ApiProperty({ type: UpdateUserDto })
  user: UpdateUserDto;
}
