import { UpdateUserDto } from '@app/user/dto';
import type { UserResponseInterface } from '@app/user/types/userResponse.interface';
import { UserEntity } from '@app/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>) {}

  async updateLoggedUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findCurrentUser({ id: userId });

    if (updateUserDto.email !== user.email) {
      const isEmailExist = await this.findCurrentUser({ email: updateUserDto.email });

      if (isEmailExist) {
        throw new HttpException('Email has been taken', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    if (updateUserDto.username !== user.username) {
      const isUserNameExist = await this.findCurrentUser({ email: updateUserDto.username });

      if (isUserNameExist) {
        throw new HttpException('Username has been taken', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async findCurrentUser(user: Partial<UserEntity>): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: { id: user.id, email: user.email, username: user.username, tokenVersion: user.tokenVersion },
      select: ['birthDate', 'bonuses', 'email', 'id', 'image', 'password', 'phone', 'username', 'tokenVersion'],
    });
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    delete user.hashPassword;
    delete user.password;
    delete user.tokenVersion;

    return { user };
  }
}
