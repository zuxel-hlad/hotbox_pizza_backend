import { Role } from '@common/types/role.enum';
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_TTL,
} from '@core/config/jwt.config';
import { AdminEntity } from '@modules/admin/admin.entity';
import { AdminService } from '@modules/admin/admin.service';
import { AuthService } from '@modules/auth/auth.service';
import { MailService } from '@modules/mail/mail.service';
import { UserEntity } from '@modules/user/user.entity';
import { HttpException, HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { compare, hash } from 'bcrypt';
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  const password = 'password123';
  const mailService = { sendResetCode: jest.fn() };
  const adminService = { ensureEmailIsFree: jest.fn() };
  let passwordHash: string;
  let userRepository: RepositoryMock;
  let adminRepository: RepositoryMock;
  let authService: AuthService;

  const createUser = (fields: Partial<UserEntity> = {}): UserEntity =>
    Object.assign(new UserEntity(), {
      id: 1,
      email: 'john@x.com',
      username: 'john',
      tokenVersion: 0,
      password: passwordHash,
      ...fields,
    });

  const createAdmin = (fields: Partial<AdminEntity> = {}): AdminEntity =>
    Object.assign(new AdminEntity(), {
      id: 5,
      email: 'admin@x.com',
      role: Role.ADMIN,
      tokenVersion: 0,
      password: passwordHash,
      ...fields,
    });

  beforeAll(async () => {
    passwordHash = await hash(password, 4);
  });

  beforeEach(() => {
    userRepository = createRepositoryMock();
    adminRepository = createRepositoryMock();
    mailService.sendResetCode.mockReset();
    adminService.ensureEmailIsFree.mockReset();
    authService = new AuthService(
      userRepository as unknown as Repository<UserEntity>,
      adminRepository as unknown as Repository<AdminEntity>,
      mailService as unknown as MailService,
      adminService as unknown as AdminService,
    );
  });

  describe('register', () => {
    const registerDto = { role: Role.CLIENT as const, email: 'john@x.com', username: 'john', password };

    it('rejects a taken email', async () => {
      adminService.ensureEmailIsFree.mockRejectedValue(
        new HttpException('Email has been taken', HttpStatus.UNPROCESSABLE_ENTITY),
      );

      await expect(authService.register(registerDto)).rejects.toMatchObject({
        message: 'Email has been taken',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('rejects a taken username', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      await expect(authService.register(registerDto)).rejects.toMatchObject({
        message: 'Username has been taken',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('saves a new user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const user = await authService.register(registerDto);

      expect(user).toBeInstanceOf(UserEntity);
      expect(user).toMatchObject(registerDto);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('saves a new admin without the username check', async () => {
      const adminDto = {
        role: Role.ADMIN as const,
        firstName: 'Ann',
        lastName: 'Lee',
        phone: '+380501234567',
        email: 'admin@x.com',
        password,
      };
      const admin = await authService.register(adminDto);

      expect(admin).toBeInstanceOf(AdminEntity);
      expect(admin).toMatchObject(adminDto);
      expect(adminRepository.save).toHaveBeenCalledWith(admin);
      expect(adminService.ensureEmailIsFree).toHaveBeenCalledWith('admin@x.com');
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'john@x.com', password };

    it('rejects an unknown email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toMatchObject({
        message: 'Invalid credentials',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('rejects a wrong password', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      await expect(authService.login({ ...loginDto, password: 'wrong-password' })).rejects.toMatchObject({
        message: 'Invalid credentials',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('returns the user for valid credentials', async () => {
      const user = createUser();
      userRepository.findOne.mockResolvedValue(user);

      await expect(authService.login(loginDto)).resolves.toBe(user);
    });

    it('returns the admin before looking up users', async () => {
      const admin = createAdmin();
      adminRepository.findOne.mockResolvedValue(admin);

      await expect(authService.login({ email: 'admin@x.com', password })).resolves.toBe(admin);
      expect(userRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const newPassword = 'new-password123';

    it('rejects an unknown user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        authService.changePassword({ oldPassword: password, newPassword }, createUser()),
      ).rejects.toMatchObject({
        message: 'User not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('rejects the same password', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      await expect(
        authService.changePassword({ oldPassword: password, newPassword: password }, createUser()),
      ).rejects.toMatchObject({
        message: 'Old password and new password are the same.',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('rejects a wrong old password', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      await expect(
        authService.changePassword({ oldPassword: 'wrong-password', newPassword }, createUser()),
      ).rejects.toMatchObject({
        message: 'Old password is incorrect.',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('hashes the new password and invalidates old tokens', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      const user = await authService.changePassword({ oldPassword: password, newPassword }, createUser());

      expect(await compare(newPassword, user.password)).toBe(true);
      expect(user.tokenVersion).toBe(1);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('saves the new admin password to the admin table', async () => {
      adminRepository.findOne.mockResolvedValue(createAdmin());

      const admin = await authService.changePassword({ oldPassword: password, newPassword }, createAdmin());

      expect(admin.tokenVersion).toBe(1);
      expect(adminRepository.save).toHaveBeenCalledWith(admin);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('sendResetPasswordCode', () => {
    it('rejects an unknown email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(authService.sendResetPasswordCode({ email: 'nobody@x.com' })).rejects.toMatchObject({
        message: 'The email "nobody@x.com" not found. Incorrect email.',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('sends a six-digit code to the masked email', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      const response = await authService.sendResetPasswordCode({ email: 'john@x.com' });

      expect(authService.otpCode).toMatch(/^\d{6}$/);
      expect(mailService.sendResetCode).toHaveBeenCalledWith('john@x.com', authService.otpCode);
      expect(response).toEqual({ message: 'Reset password code sent to jo*n@x.com', statusCode: HttpStatus.OK });
    });
  });

  describe('verifyResetPasswordCode', () => {
    const verifyDto = { email: 'john@x.com', code: '123456', password: 'new-password123' };

    it('rejects a wrong code', async () => {
      authService.otpCode = '654321';

      await expect(authService.verifyResetPasswordCode(verifyDto)).rejects.toMatchObject({
        message: 'Invalid otp code',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('rejects an unknown email', async () => {
      authService.otpCode = verifyDto.code;
      userRepository.findOne.mockResolvedValue(null);

      await expect(authService.verifyResetPasswordCode(verifyDto)).rejects.toMatchObject({
        message: 'The email "john@x.com" not found. Incorrect email.',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('sets the new password and clears the code', async () => {
      authService.otpCode = verifyDto.code;
      userRepository.findOne.mockResolvedValue(createUser());

      const user = await authService.verifyResetPasswordCode(verifyDto);

      expect(await compare(verifyDto.password, user.password)).toBe(true);
      expect(user.tokenVersion).toBe(1);
      expect(authService.otpCode).toBeNull();
    });
  });

  describe('buildAuthResponse', () => {
    it('signs access and refresh tokens with the user payload', () => {
      const user = createUser({ tokenVersion: 3 });

      const { access, refresh } = authService.buildAuthResponse(user);
      const payload = { id: 1, email: 'john@x.com', username: 'john', tokenVersion: 3 };

      expect(access.expiresIn).toBe(ACCESS_TOKEN_TTL);
      expect(refresh.expiresIn).toBe(REFRESH_TOKEN_TTL);
      expect(verify(access.token, ACCESS_TOKEN_SECRET) as JwtPayload).toMatchObject(payload);
      expect(verify(refresh.token, REFRESH_TOKEN_SECRET) as JwtPayload).toMatchObject(payload);
    });

    it('signs admin tokens with the admin role and without username', () => {
      const { access } = authService.buildAuthResponse(createAdmin());
      const payload = verify(access.token, ACCESS_TOKEN_SECRET) as JwtPayload;

      expect(payload).toMatchObject({ id: 5, email: 'admin@x.com', tokenVersion: 0, role: Role.ADMIN });
      expect(payload).not.toHaveProperty('username');
    });
  });

  describe('renewAccessToken', () => {
    it('returns an access token for the user of a valid refresh token', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      const { token, expiresIn } = await authService.renewAccessToken(
        sign({ id: 1, tokenVersion: 2 }, REFRESH_TOKEN_SECRET),
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1, tokenVersion: 2 } });
      expect(expiresIn).toBe(ACCESS_TOKEN_TTL);
      expect(verify(token, ACCESS_TOKEN_SECRET) as JwtPayload).toMatchObject({ id: 1 });
    });

    it('looks up the admin for an admin refresh token', async () => {
      adminRepository.findOne.mockResolvedValue(createAdmin());

      const { token } = await authService.renewAccessToken(
        sign({ id: 5, tokenVersion: 0, role: Role.ADMIN }, REFRESH_TOKEN_SECRET),
      );

      expect(adminRepository.findOne).toHaveBeenCalledWith({ where: { id: 5, tokenVersion: 0 } });
      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(verify(token, ACCESS_TOKEN_SECRET) as JwtPayload).toMatchObject({ id: 5, role: Role.ADMIN });
    });

    it.each([
      ['an expired token', sign({ id: 1 }, REFRESH_TOKEN_SECRET, { expiresIn: -1 }), 'Refresh token expired'],
      ['a token with another secret', sign({ id: 1 }, 'another-secret'), 'Invalid refresh token'],
      ['a malformed token', 'malformed', 'Invalid refresh token'],
    ])('rejects %s', async (_case, token, message) => {
      await expect(authService.renewAccessToken(token)).rejects.toMatchObject({
        message,
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('rejects a revoked token or an unknown user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(authService.renewAccessToken(sign({ id: 1 }, REFRESH_TOKEN_SECRET))).rejects.toMatchObject({
        message: 'Invalid refresh token',
        status: HttpStatus.UNAUTHORIZED,
      });
    });
  });
});
