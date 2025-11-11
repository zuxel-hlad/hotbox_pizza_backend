import { Transform } from 'class-transformer';
import { IsDateString, IsEmail, IsOptional, IsPhoneNumber, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  readonly email: string;

  @IsOptional()
  readonly username: string;

  @IsOptional()
  @Transform(({ value }: { value: Date }) => value || undefined)
  @IsDateString()
  readonly birthDate: string;

  @IsOptional()
  @Transform(({ value }: { value: Date }) => value || undefined)
  @IsUrl({ require_protocol: true, require_valid_protocol: true, protocols: ['http', 'https'] })
  readonly image: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => value || undefined)
  @IsPhoneNumber('UA')
  readonly phone: string;
}
