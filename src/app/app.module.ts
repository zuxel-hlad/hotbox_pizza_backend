import { AppController } from '@app/app/app.controller';
import { AppService } from '@app/app/app.service';
import ormConfig from '@app/orm/orm.config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
