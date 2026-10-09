import { createTestApp, TestApp } from '@test/helpers/test-app.helper';
import request from 'supertest';

describe('AppModule (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('formats an unknown route as a 404 error', async () => {
    const response = await request(testApp.app.getHttpServer()).get('/unknown').expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      timestamp: expect.any(String) as string,
      path: '/unknown',
      message: 'Cannot GET /unknown',
    });
  });
});
