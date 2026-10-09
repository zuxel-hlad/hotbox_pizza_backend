import { maskEmail } from '@common/helpers/email.helper';
import { generateOTP } from '@common/helpers/otp.helper';
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_TTL,
} from '@core/config/jwt.config';
import { ChangePasswordDto } from '@modules/auth/dto/change-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';
import { VerifyResetPasswordDto } from '@modules/auth/dto/verify-reset-password.dto';
import { AuthResponse } from '@modules/auth/types/auth-response.interface';
import { ResetPasswordCodeResponse } from '@modules/auth/types/reset-password-code-response.interface';
import { MailService } from '@modules/mail/mail.service';
import { Token } from '@modules/token/types/token.interface';
import { UserEntity } from '@modules/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class AuthService {
  otpCode: string | null = null;
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserEntity> {
    const userByEmail = await this.userRepository.findOne({ where: { email: registerDto.email } });
    const userByUserName = await this.userRepository.findOne({ where: { username: registerDto.username } });

    if (userByEmail) {
      throw new HttpException('Email has been taken', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    if (userByUserName) {
      throw new HttpException('Username has been taken', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const newUser = Object.assign(new UserEntity(), registerDto);

    return this.userRepository.save(newUser);
  }

  async login(loginDto: LoginDto): Promise<UserEntity> {
    const user = await this.findWithPassword({ email: loginDto.email });
    const isPasswordValid = user && (await compare(loginDto.password, user.password));

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return user;
  }

  async changePassword(password: ChangePasswordDto, userId: number): Promise<UserEntity> {
    const user = await this.findWithPassword({ id: userId });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (password.newPassword === password.oldPassword) {
      throw new HttpException('Old password and new password are the same.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const isOldPasswordValid = await compare(password.oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new HttpException('Old password is incorrect.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return this.setPassword(user, password.newPassword);
  }

  async sendResetPasswordCode({ email }: ResetPasswordDto): Promise<ResetPasswordCodeResponse> {
    await this.findByEmailOrFail(email);

    this.otpCode = generateOTP();
    await this.mailService.sendMail(email, 'Password reset code', this.otpCode);

    return { message: `Reset password code sent to ${maskEmail(email)}`, statusCode: HttpStatus.OK };
  }

  async verifyResetPasswordCode({ code, password, email }: VerifyResetPasswordDto): Promise<UserEntity> {
    if (code !== this.otpCode) {
      throw new HttpException('Invalid otp code', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const user = await this.findByEmailOrFail(email);
    this.otpCode = null;

    return this.setPassword(user, password);
  }

  buildAuthResponse(user: UserEntity): AuthResponse {
    return {
      access: this.buildToken(user, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL),
      refresh: this.buildToken(user, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_TTL),
    };
  }

  buildToken({ id, username, email, tokenVersion }: UserEntity, secret: string, expiresIn: number): Token {
    return { token: sign({ id, username, email, tokenVersion }, secret, { expiresIn }), expiresIn };
  }

  private findWithPassword(where: FindOptionsWhere<UserEntity>): Promise<UserEntity> {
    return this.userRepository.findOne({
      where,
      select: { id: true, email: true, username: true, tokenVersion: true, password: true },
    });
  }

  private async findByEmailOrFail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new HttpException(`The email "${email}" not found. Incorrect email.`, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return user;
  }

  private async setPassword(user: UserEntity, password: string): Promise<UserEntity> {
    user.password = await hash(password, 10);
    user.tokenVersion += 1;

    return this.userRepository.save(user);
  }
}
