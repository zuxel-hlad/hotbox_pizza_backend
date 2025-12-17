import { ChangePasswordDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyResetPasswordDto } from '@app/auth/dto';
import { AuthResponse } from '@app/auth/types/auth.response.interface';
import { ResetPasswordCodeResponse } from '@app/auth/types/reset.password.code.response.interface';
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_TTL } from '@app/constants';
import { MailService } from '@app/mailer/mailer.service';
import { UserEntity } from '@app/user/user.entity';
import { generateOTP, maskEmail } from '@app/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Repository } from 'typeorm';

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
    const user = await this.findCurrentUser({ email: loginDto.email });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const isPasswordValid = await compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return user;
  }

  async findCurrentUser(user: Partial<UserEntity>): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: { id: user.id, email: user.email, username: user.username, tokenVersion: user.tokenVersion },
      select: ['birthDate', 'bonuses', 'email', 'id', 'image', 'password', 'phone', 'username', 'tokenVersion'],
    });
  }

  async changePassword(password: ChangePasswordDto, userId: number): Promise<UserEntity> {
    const user = await this.findCurrentUser({ id: userId });

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

    const hashedNewPassword = await hash(password.newPassword, 10);
    user.password = hashedNewPassword;
    user.tokenVersion += 1;

    return await this.userRepository.save(user);
  }

  async sendResetPasswordCode({ email }: ResetPasswordDto): Promise<ResetPasswordCodeResponse> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new HttpException(`The email "${email}" not found. Incorrect email.`, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    this.otpCode = generateOTP();
    await this.mailService.sendMail(email, 'Password reset code', this.otpCode);

    return { message: `Reset password code sent to ${maskEmail(email)}`, statusCode: HttpStatus.OK };
  }

  async verifyResetPasswordCode({ code, password, email }: VerifyResetPasswordDto): Promise<UserEntity> {
    if (code !== this.otpCode) {
      throw new HttpException('Invalid otp code', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new HttpException(`The email "${email}" not found. Incorrect email.`, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const hashedNewPassword = await hash(password, 10);
    user.password = hashedNewPassword;
    user.tokenVersion += 1;
    this.otpCode = null;

    return await this.userRepository.save(user);
  }

  buildAuthResponse(user: UserEntity): AuthResponse {
    return {
      access: {
        token: this.generateJwt(user, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL),
        expiresIn: ACCESS_TOKEN_TTL,
      },
      refresh: {
        token: this.generateJwt(user, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_TTL),
        expiresIn: REFRESH_TOKEN_TTL,
      },
    };
  }

  generateJwt(user: UserEntity, secret: string, expiresIn: number): string {
    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        tokenVersion: user.tokenVersion,
      },
      secret,
      { expiresIn },
    );
  }
}
