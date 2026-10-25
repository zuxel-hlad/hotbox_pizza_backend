import { Role } from '@common/types/role.enum';
import { AdminEntity } from '@modules/admin/admin.entity';
import { OrderEntity } from '@modules/order/order.entity';
import { UserEntity } from '@modules/user/user.entity';
import { createQueryBuilderMock } from '@test/helpers/query-builder.mock';
import { RepositoryMock } from '@test/helpers/repository.mock';
import { createAdminAuthHeader, createAuthHeader, createTestApp, TestApp } from '@test/helpers/test-app.helper';
import request from 'supertest';
import { App } from 'supertest/types';

describe('Admin (e2e)', () => {
  const user = { id: 1, email: 'john@x.com', username: 'john', tokenVersion: 0 };
  const adminResponse = {
    id: 5,
    firstName: 'Ann',
    lastName: 'Lee',
    phone: '+380501234567',
    email: 'admin@x.com',
    role: Role.ADMIN as const,
  };
  const admin = { ...adminResponse, tokenVersion: 0 };
  const authHeader = createAuthHeader(user);
  const adminAuthHeader = createAdminAuthHeader(admin);
  let testApp: TestApp;
  let server: App;
  let adminRepository: RepositoryMock;

  beforeAll(async () => {
    testApp = await createTestApp();
    server = testApp.app.getHttpServer();
  });

  beforeEach(() => {
    testApp.resetMocks();
    adminRepository = testApp.repository(AdminEntity);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('GET /admin/list', () => {
    it('rejects a client', async () => {
      testApp.repository(UserEntity).findOne.mockResolvedValueOnce(user);

      await request(server).get('/admin/list?page=1&pageSize=10').set('Authorization', authHeader).expect(403);
    });

    it('returns a page of admins', async () => {
      adminRepository.findOne.mockResolvedValueOnce(admin);
      adminRepository.createQueryBuilder.mockReturnValue(createQueryBuilderMock([admin]));

      const response = await request(server)
        .get('/admin/list?page=1&pageSize=10&search=ann')
        .set('Authorization', adminAuthHeader)
        .expect(200);

      expect(response.body).toMatchObject({ content: [admin], totalElements: 1 });
    });
  });

  it('GET /user/me returns the logged admin', async () => {
    adminRepository.findOne.mockResolvedValueOnce({ ...admin });

    const response = await request(server).get('/user/me').set('Authorization', adminAuthHeader).expect(200);

    expect(response.body).toEqual({ user: adminResponse });
  });

  describe('PUT /order/update/:id', () => {
    it('rejects a client', async () => {
      testApp.repository(UserEntity).findOne.mockResolvedValueOnce(user);

      await request(server).put('/order/update/1').set('Authorization', authHeader).send({ comment: 'x' }).expect(403);
    });

    it('updates the order', async () => {
      adminRepository.findOne.mockResolvedValueOnce(admin);
      testApp.repository(OrderEntity).findOne.mockResolvedValue({ id: 1, comment: '' });

      await request(server)
        .put('/order/update/1')
        .set('Authorization', adminAuthHeader)
        .send({ comment: 'call me' })
        .expect(200, { id: 1, comment: 'call me' });
    });
  });
});
