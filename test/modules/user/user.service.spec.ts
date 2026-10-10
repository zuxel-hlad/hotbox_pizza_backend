import { UserResponseDto } from '@modules/user/dto/user-response.dto';
import { UserEntity } from '@modules/user/user.entity';
import { UserService } from '@modules/user/user.service';
import { HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { Repository } from 'typeorm';

describe('UserService', () => {
  let userRepository: RepositoryMock;
  let userService: UserService;

  const createUser = (): UserEntity =>
    Object.assign(new UserEntity(), {
      id: 1,
      email: 'john@x.com',
      username: 'john',
      tokenVersion: 2,
    });

  beforeEach(() => {
    userRepository = createRepositoryMock();
    userService = new UserService(userRepository as unknown as Repository<UserEntity>);
  });

  describe('updateLoggedUser', () => {
    it('rejects an email taken by another user', async () => {
      userRepository.findOne.mockResolvedValueOnce(createUser()).mockResolvedValueOnce({ id: 2 });

      await expect(
        userService.updateLoggedUser(1, { email: 'taken@x.com', username: 'john' } as never),
      ).rejects.toMatchObject({ message: 'Email has been taken', status: HttpStatus.UNPROCESSABLE_ENTITY });
    });

    it('saves the updated fields', async () => {
      userRepository.findOne.mockResolvedValueOnce(createUser()).mockResolvedValueOnce(null);

      const user = await userService.updateLoggedUser(1, {
        email: 'new@x.com',
        username: 'john',
        phone: '+380501234567',
      } as never);

      expect(user).toMatchObject({ id: 1, email: 'new@x.com', phone: '+380501234567' });
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });

    it('rejects a username taken by another user', async () => {
      userRepository.findOne.mockResolvedValueOnce(createUser()).mockResolvedValueOnce({ id: 2 });

      await expect(
        userService.updateLoggedUser(1, { email: 'john@x.com', username: 'taken' } as never),
      ).rejects.toMatchObject({ message: 'Username has been taken', status: HttpStatus.UNPROCESSABLE_ENTITY });
      expect(userRepository.findOne).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ username: 'taken' }) as object }),
      );
    });

    it('skips uniqueness checks for omitted email and username', async () => {
      userRepository.findOne.mockResolvedValueOnce(createUser()).mockResolvedValueOnce({ id: 2 });

      await expect(userService.updateLoggedUser(1, { phone: '+380501234567' } as never)).resolves.toMatchObject({
        email: 'john@x.com',
        phone: '+380501234567',
      });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  it('finds the current user by token claims', async () => {
    await userService.findCurrentUser({ id: 1, tokenVersion: 2 });

    expect(userRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, email: undefined, username: undefined, tokenVersion: 2 } }),
    );
  });

  it('builds a user response without secrets', () => {
    const { user } = JSON.parse(JSON.stringify(userService.buildUserResponse(createUser()))) as UserResponseDto;

    expect(user).toMatchObject({ id: 1, email: 'john@x.com', username: 'john' });
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('tokenVersion');
  });
});
