import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { validationPipe } from '../src/common/pipes/validation.pipe';

describe('Billing (e2e)', () => {
  let app: INestApplication;
  let token: string;

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
        email: `billing-${Date.now()}@example.com`,
        password: 'password123',
      });
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns subscription for tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/billing/subscription')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.plan).toBe('free');
  });

  it('rejects webhook without signature', async () => {
    await request(app.getHttpServer())
      .post('/api/billing/webhook')
      .send({ type: 'test' })
      .expect(400);
  });
});
