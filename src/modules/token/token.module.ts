import { AuthModule } from '@modules/auth/auth.module';
import { TokenController } from '@modules/token/token.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [AuthModule],
  controllers: [TokenController],
})
export class TokenModule {}
