import { maskEmail } from '@common/helpers/email.helper';
import { generateOTP } from '@common/helpers/otp.helper';
import { Role } from '@common/types/role.enum';
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_TTL,
} from '@core/config/jwt.config';
import { AdminEntity } from '@modules/admin/admin.entity';
import { AdminService } from '@modules/admin/admin.service';
import { ChangePasswordDto } from '@modules/auth/dto/change-password.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import { ResetPasswordDto } from '@modules/auth/dto/reset-password.dto';
import { VerifyResetPasswordDto } from '@modules/auth/dto/verify-reset-password.dto';
import { AccountWhere } from '@modules/auth/types/account-where.type';
import { Account } from '@modules/auth/types/account.type';
import { AuthResponse } from '@modules/auth/types/auth-response.interface';
import { ResetPasswordCodeResponse } from '@modules/auth/types/reset-password-code-response.interface';
import { MailService } from '@modules/mail/mail.service';
import { TokenPayload } from '@modules/token/types/token-payload.interface';
import { Token } from '@modules/token/types/token.interface';
import { UserEntity } from '@modules/user/user.entity';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { sign, TokenExpiredError, verify } from 'jsonwebtoken';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  otpCode: string | null = null;
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AdminEntity) private readonly adminRepository: Repository<AdminEntity>,
    private readonly mailService: MailService,
    private readonly adminService: AdminService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Account> {
    await this.adminService.ensureEmailIsFree(registerDto.email);

    if (registerDto.role === Role.ADMIN) {
      return this.adminRepository.save(Object.assign(new AdminEntity(), registerDto));
    }

    const userByUserName = await this.userRepository.findOne({ where: { username: registerDto.username } });

    if (userByUserName) {
      throw new HttpException('Username has been taken', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return this.userRepository.save(Object.assign(new UserEntity(), registerDto));
  }

  async login(loginDto: LoginDto): Promise<Account> {
    const admin = await this.findWithPassword({ email: loginDto.email }, Role.ADMIN);
    const account = admin ?? (await this.findWithPassword({ email: loginDto.email }, Role.CLIENT));
    const isPasswordValid = account && (await compare(loginDto.password, account.password));

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return account;
  }

  async changePassword(password: ChangePasswordDto, { id, role }: Account): Promise<Account> {
    const account = await this.findWithPassword({ id }, role);

    if (!account) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (password.newPassword === password.oldPassword) {
      throw new HttpException('Old password and new password are the same.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const isOldPasswordValid = await compare(password.oldPassword, account.password);

    if (!isOldPasswordValid) {
      throw new HttpException('Old password is incorrect.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return this.setPassword(account, password.newPassword);
  }

  async sendResetPasswordCode({ email }: ResetPasswordDto): Promise<ResetPasswordCodeResponse> {
    await this.findByEmailOrFail(email);

    this.otpCode = generateOTP();
    await this.mailService.sendResetCode(email, this.otpCode);

    return { message: `Reset password code sent to ${maskEmail(email)}`, statusCode: HttpStatus.OK };
  }

  async verifyResetPasswordCode({ code, password, email }: VerifyResetPasswordDto): Promise<Account> {
    if (code !== this.otpCode) {
      throw new HttpException('Invalid otp code', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const account = await this.findByEmailOrFail(email);
    this.otpCode = null;

    return this.setPassword(account, password);
  }

  buildAuthResponse(account: Account): AuthResponse {
    return {
      access: this.buildToken(account, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL),
      refresh: this.buildToken(account, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_TTL),
    };
  }

  async renewAccessToken(refreshToken: string): Promise<Token> {
    let payload: TokenPayload;

    try {
      payload = verify(refreshToken, REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      const isTokenExpired = error instanceof TokenExpiredError;

      if (isTokenExpired) {
        throw new UnauthorizedException('Refresh token expired');
      }

      throw new UnauthorizedException('Invalid refresh token');
    }

    const account = await this.findAccount({ id: payload.id, tokenVersion: payload.tokenVersion }, payload.role);

    if (!account) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildToken(account, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_TTL);
  }

  buildToken(account: Account, secret: string, expiresIn: number): Token {
    const { id, email, tokenVersion } = account;
    const payload: TokenPayload = { id, email, tokenVersion, role: account.role };

    if (account.role !== Role.ADMIN) {
      payload.username = account.username;
    }

    return { token: sign(payload, secret, { expiresIn }), expiresIn };
  }

  private findAccount(where: AccountWhere, role: Role): Promise<Account> {
    if (role === Role.ADMIN) {
      return this.adminRepository.findOne({ where });
    }

    return this.userRepository.findOne({ where });
  }

  private findWithPassword(where: AccountWhere, role: Role): Promise<Account> {
    const select = { id: true, email: true, tokenVersion: true, role: true, password: true };

    if (role === Role.ADMIN) {
      return this.adminRepository.findOne({ where, select });
    }

    return this.userRepository.findOne({ where, select: { ...select, username: true } });
  }

  private async findByEmailOrFail(email: string): Promise<Account> {
    const admin = await this.findAccount({ email }, Role.ADMIN);
    const account = admin ?? (await this.findAccount({ email }, Role.CLIENT));

    if (!account) {
      throw new HttpException(`The email "${email}" not found. Incorrect email.`, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return account;
  }

  private async setPassword(account: Account, password: string): Promise<Account> {
    account.password = await hash(password, 10);
    account.tokenVersion += 1;

    if (account.role === Role.ADMIN) {
      return this.adminRepository.save(account);
    }

    return this.userRepository.save(account);
  }
}
