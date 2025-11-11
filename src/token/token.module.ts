import { AuthModule } from '@app/auth/auth.module';
import { TokenController } from '@app/token/token.controller';
import { TokenService } from '@app/token/token.service';
import { UserEntity } from '@app/user/user.entity';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), forwardRef(() => AuthModule)],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
