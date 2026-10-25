import { AdminService } from '@modules/admin/admin.service';
import { Account } from '@modules/auth/types/account.type';
import { UpdateUserDto } from '@modules/user/dto/update-user.dto';
import { UserResponseDto } from '@modules/user/dto/user-response.dto';
import { UserEntity } from '@modules/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    private readonly adminService: AdminService,
  ) {}

  async updateLoggedUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findCurrentUser({ id: userId });

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.adminService.ensureEmailIsFree(updateUserDto.email);
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

  buildUserResponse(account: Account): UserResponseDto {
    delete account.password;
    delete account.tokenVersion;

    return { user: account };
  }
}
