import { AdminFiltersService } from '@modules/admin/admin-filters.service';
import { AdminEntity } from '@modules/admin/admin.entity';
import { PagedAdminsRequestDto } from '@modules/admin/dto/paged-admins.dto';
import { UpdateAdminRequestDto } from '@modules/admin/dto/update-admin.dto';
import { AdminResponse } from '@modules/admin/types/admin-response';
import { PagedAdminResponse } from '@modules/admin/types/paged-admin-response';
import { UserEntity } from '@modules/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepository: Repository<AdminEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly adminFilters: AdminFiltersService,
  ) {}

  async findAll(query: PagedAdminsRequestDto): Promise<PagedAdminResponse> {
    return await this.adminFilters.getFilteredData(query);
  }

  async findById(adminId: number): Promise<AdminResponse> {
    const admin = await this.adminRepository.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
    }

    return admin;
  }

  async update(adminId: number, updateAdminDto: UpdateAdminRequestDto): Promise<AdminResponse> {
    const admin = await this.findById(adminId);

    if (updateAdminDto.email !== admin.email) {
      await this.ensureEmailIsFree(updateAdminDto.email);
    }

    Object.assign(admin, updateAdminDto);

    return await this.adminRepository.save(admin);
  }

  async delete(adminId: number): Promise<DeleteResult> {
    await this.findById(adminId);

    return await this.adminRepository.delete({ id: adminId });
  }

  findOne(where: FindOptionsWhere<AdminEntity>): Promise<AdminEntity> {
    return this.adminRepository.findOne({ where });
  }

  async ensureEmailIsFree(email: string): Promise<void> {
    const [isAdminEmailTaken, isUserEmailTaken] = await Promise.all([
      this.adminRepository.existsBy({ email }),
      this.userRepository.existsBy({ email }),
    ]);

    if (isAdminEmailTaken || isUserEmailTaken) {
      throw new HttpException('Email has been taken', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
