import { toPagedData } from '@common/helpers/paged.helper';
import { AdminEntity } from '@modules/admin/admin.entity';
import { PagedAdminsRequestDto } from '@modules/admin/dto/paged-admins.dto';
import { PagedAdminResponse } from '@modules/admin/types/paged-admin-response';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AdminFiltersService {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepository: Repository<AdminEntity>,
  ) {}

  async getFilteredData(query: PagedAdminsRequestDto): Promise<PagedAdminResponse> {
    const { page, pageSize, search, userId, orderId, ...fields } = query;
    const baseQuery = this.adminRepository.createQueryBuilder('admin');

    for (const [field, value] of Object.entries(fields)) {
      if (value) {
        baseQuery.andWhere(`admin.${field} ILIKE :${field}`, { [field]: this.toLikePattern(value) });
      }
    }

    if (search) {
      baseQuery.andWhere(
        '(admin.firstName ILIKE :search OR admin.lastName ILIKE :search OR admin.email ILIKE :search OR admin.phone ILIKE :search)',
        { search: this.toLikePattern(search) },
      );
    }

    if (userId) {
      baseQuery.andWhere(
        'EXISTS (SELECT 1 FROM order_list WHERE order_list."adminId" = admin.id AND order_list."userId" = :userId)',
        { userId },
      );
    }

    if (orderId) {
      baseQuery.andWhere(
        'EXISTS (SELECT 1 FROM order_list WHERE order_list."adminId" = admin.id AND order_list.id = :orderId)',
        { orderId },
      );
    }

    const [content, totalElements] = await baseQuery
      .orderBy('admin.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return toPagedData(content, totalElements, page, pageSize);
  }

  private toLikePattern(value: string): string {
    return `%${value.trim().replace(/[\\%_]/g, '\\$&')}%`;
  }
}
