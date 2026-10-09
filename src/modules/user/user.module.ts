import { AuthModule } from '@modules/auth/auth.module';
import { UserController } from '@modules/user/user.controller';
import { UserEntity } from '@modules/user/user.entity';
import { UserService } from '@modules/user/user.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
