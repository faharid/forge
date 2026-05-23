import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { validationPipe } from '../src/common/pipes/validation.pipe';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(validationPipe);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: `admin-${Date.now()}@example.com`,
        password: 'password123',
        tenantName: 'RBAC Test',
      });
    adminToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin can create users', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `member-${Date.now()}@example.com`,
        password: 'password123',
        role: 'member',
      })
      .expect((res) => expect(res.status).toBeLessThan(300));
  });
});
