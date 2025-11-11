import { REFRESH_TOKEN_SECRET } from '@app/constants';
import { UserEntity } from '@app/user/user.entity';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { verify } from 'jsonwebtoken';
import { Repository } from 'typeorm';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async renewToken(token: string): Promise<UserEntity> {
    try {
      const { id: userId } = verify(token, REFRESH_TOKEN_SECRET) as UserEntity;

      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Refresh token expired');
        }

        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid refresh token');
        }
      }

      throw new UnauthorizedException('Unable to verify refresh token');
    }
  }
}
