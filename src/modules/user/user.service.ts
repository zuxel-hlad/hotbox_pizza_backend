import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { UserResponseDto } from '@modules/user/dto/user-response.dto';
import { UserEntity } from '@modules/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>) {}

  async updateLoggedUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findCurrentUser({ id: userId });

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const isEmailExist = await this.findCurrentUser({ email: updateUserDto.email });

      if (isEmailExist) {
        throw new HttpException('Email has been taken', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const isUserNameExist = await this.findCurrentUser({ username: updateUserDto.username });

      if (isUserNameExist) {
        throw new HttpException('Username has been taken', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  findCurrentUser(where: FindOptionsWhere<UserEntity>): Promise<UserEntity> {
    return this.userRepository.findOne({ where });
  }

  buildUserResponse(user: UserEntity): UserResponseDto {
    delete user.password;
    delete user.tokenVersion;

    return { user };
  }
}
