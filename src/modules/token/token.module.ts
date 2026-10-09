import { AuthModule } from '@modules/auth/auth.module';
import { TokenController } from '@modules/token/token.controller';
import { TokenService } from '@modules/token/token.service';
import { UserEntity } from '@modules/user/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
