import { REFRESH_TOKEN_SECRET } from '@core/config/jwt.config';
import { TokenService } from '@modules/token/token.service';
import { UserEntity } from '@modules/user/user.entity';
import { HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { sign } from 'jsonwebtoken';
import { Repository } from 'typeorm';

describe('TokenService', () => {
  let userRepository: RepositoryMock;
  let tokenService: TokenService;

  beforeEach(() => {
    userRepository = createRepositoryMock();
    tokenService = new TokenService(userRepository as unknown as Repository<UserEntity>);
  });

  it('returns the user of a valid refresh token', async () => {
    const user = { id: 7 };
    userRepository.findOne.mockResolvedValue(user);

    await expect(tokenService.renewToken(sign({ id: 7 }, REFRESH_TOKEN_SECRET))).resolves.toBe(user);
    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it.each([
    ['an expired token', sign({ id: 7 }, REFRESH_TOKEN_SECRET, { expiresIn: -1 }), 'Refresh token expired'],
    ['a token with another secret', sign({ id: 7 }, 'another-secret'), 'Invalid refresh token'],
    ['a malformed token', 'malformed', 'Invalid refresh token'],
  ])('rejects %s', async (_case, token, message) => {
    await expect(tokenService.renewToken(token)).rejects.toMatchObject({ message, status: HttpStatus.UNAUTHORIZED });
  });

  it('rejects an unknown user', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(tokenService.renewToken(sign({ id: 7 }, REFRESH_TOKEN_SECRET))).rejects.toMatchObject({
      message: 'User not found',
      status: HttpStatus.NOT_FOUND,
    });
  });
});
