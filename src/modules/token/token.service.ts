import { REFRESH_TOKEN_SECRET } from '@core/config/jwt.config';
import { UserEntity } from '@modules/user/user.entity';
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
    const userId = this.verifyRefreshToken(token);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private verifyRefreshToken(token: string): number {
    try {
      const { id } = verify(token, REFRESH_TOKEN_SECRET) as UserEntity;

      return id;
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
