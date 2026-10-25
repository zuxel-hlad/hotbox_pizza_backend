import { AdminFiltersService } from '@modules/admin/admin-filters.service';
import { AdminController } from '@modules/admin/admin.controller';
import { AdminEntity } from '@modules/admin/admin.entity';
import { AdminService } from '@modules/admin/admin.service';
import { UserEntity } from '@modules/user/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity, UserEntity])],
  controllers: [AdminController],
  providers: [AdminService, AdminFiltersService],
  exports: [AdminService],
})
export class AdminModule {}
