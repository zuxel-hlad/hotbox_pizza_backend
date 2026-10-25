import { AdminEntity } from '@modules/admin/admin.entity';
import { AdminModule } from '@modules/admin/admin.module';
import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/auth.service';
import { MailModule } from '@modules/mail/mail.module';
import { UserEntity } from '@modules/user/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AdminEntity]), MailModule, AdminModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
