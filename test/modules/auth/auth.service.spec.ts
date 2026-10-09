import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_TTL,
} from '@core/config/jwt.config';
import { AuthService } from '@modules/auth/auth.service';
import { MailService } from '@modules/mail/mail.service';
import { UserEntity } from '@modules/user/user.entity';
import { HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { compare, hash } from 'bcrypt';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  const password = 'password123';
  const mailService = { sendMail: jest.fn() };
  let passwordHash: string;
  let userRepository: RepositoryMock;
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

  beforeAll(async () => {
    passwordHash = await hash(password, 4);
  });

  beforeEach(() => {
    userRepository = createRepositoryMock();
    mailService.sendMail.mockReset();
    authService = new AuthService(
      userRepository as unknown as Repository<UserEntity>,
      mailService as unknown as MailService,
    );
  });

  describe('register', () => {
    const registerDto = { email: 'john@x.com', username: 'john', password };

    it('rejects a taken email', async () => {
      userRepository.findOne.mockResolvedValueOnce(createUser()).mockResolvedValueOnce(null);

      await expect(authService.register(registerDto)).rejects.toMatchObject({
        message: 'Email has been taken',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('rejects a taken username', async () => {
      userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(createUser());

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
  });

  describe('changePassword', () => {
    const newPassword = 'new-password123';

    it('rejects an unknown user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(authService.changePassword({ oldPassword: password, newPassword }, 1)).rejects.toMatchObject({
        message: 'User not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('rejects the same password', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      await expect(
        authService.changePassword({ oldPassword: password, newPassword: password }, 1),
      ).rejects.toMatchObject({
        message: 'Old password and new password are the same.',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('rejects a wrong old password', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      await expect(authService.changePassword({ oldPassword: 'wrong-password', newPassword }, 1)).rejects.toMatchObject(
        {
          message: 'Old password is incorrect.',
          status: HttpStatus.UNPROCESSABLE_ENTITY,
        },
      );
    });

    it('hashes the new password and invalidates old tokens', async () => {
      userRepository.findOne.mockResolvedValue(createUser());

      const user = await authService.changePassword({ oldPassword: password, newPassword }, 1);

      expect(await compare(newPassword, user.password)).toBe(true);
      expect(user.tokenVersion).toBe(1);
      expect(userRepository.save).toHaveBeenCalledWith(user);
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
      expect(mailService.sendMail).toHaveBeenCalledWith('john@x.com', 'Password reset code', authService.otpCode);
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
  });
});
