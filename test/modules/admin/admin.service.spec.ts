import { AdminFiltersService } from '@modules/admin/admin-filters.service';
import { AdminEntity } from '@modules/admin/admin.entity';
import { AdminService } from '@modules/admin/admin.service';
import { UserEntity } from '@modules/user/user.entity';
import { HttpStatus } from '@nestjs/common';
import { createRepositoryMock, RepositoryMock } from '@test/helpers/repository.mock';
import { Repository } from 'typeorm';

describe('AdminService', () => {
  const updateAdminDto = { firstName: 'John', lastName: 'Doe', phone: '+380501234567', email: 'admin@x.com' };
  const adminFilters = { getFilteredData: jest.fn() };
  let adminRepository: RepositoryMock;
  let userRepository: RepositoryMock;
  let adminService: AdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    adminRepository = createRepositoryMock();
    userRepository = createRepositoryMock();
    adminService = new AdminService(
      adminRepository as unknown as Repository<AdminEntity>,
      userRepository as unknown as Repository<UserEntity>,
      adminFilters as unknown as AdminFiltersService,
    );
  });

  it('delegates paging to the filter service', async () => {
    const query = { page: 1, pageSize: 10 };
    adminFilters.getFilteredData.mockResolvedValue({ content: [] });

    await expect(adminService.findAll(query)).resolves.toEqual({ content: [] });
    expect(adminFilters.getFilteredData).toHaveBeenCalledWith(query);
  });

  it('rejects an unknown admin', async () => {
    adminRepository.findOne.mockResolvedValue(null);

    await expect(adminService.findById(1)).rejects.toMatchObject({
      message: 'Admin not found',
      status: HttpStatus.NOT_FOUND,
    });
  });

  describe('update', () => {
    it('skips the email check for an unchanged email', async () => {
      adminRepository.findOne.mockResolvedValue({ id: 1, ...updateAdminDto });

      const admin = await adminService.update(1, { ...updateAdminDto, firstName: 'Jane' });

      expect(adminRepository.existsBy).not.toHaveBeenCalled();
      expect(admin).toMatchObject({ id: 1, firstName: 'Jane' });
    });

    it('rejects a taken email', async () => {
      adminRepository.findOne.mockResolvedValue({ id: 1, ...updateAdminDto });
      userRepository.existsBy.mockResolvedValue(true);

      await expect(adminService.update(1, { ...updateAdminDto, email: 'taken@x.com' })).rejects.toMatchObject({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });
  });

  it('deletes an existing admin', async () => {
    adminRepository.findOne.mockResolvedValue({ id: 1 });
    adminRepository.delete.mockResolvedValue({ raw: [], affected: 1 });

    await expect(adminService.delete(1)).resolves.toEqual({ raw: [], affected: 1 });
    expect(adminRepository.delete).toHaveBeenCalledWith({ id: 1 });
  });
});
