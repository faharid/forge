import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { validationPipe } from '../src/common/pipes/validation.pipe';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(validationPipe);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signup and login', async () => {
    const email = `test-${Date.now()}@example.com`;
    const signup = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email, password: 'password123', tenantName: 'Test Co' })
      .expect((res) => expect(res.status).toBeLessThan(300));

    expect(signup.body.accessToken).toBeDefined();
    expect(signup.body.user.email).toBe(email);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect((res) => expect(res.status).toBeLessThan(300));

    expect(login.body.accessToken).toBeDefined();

    const refresh = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect((res) => expect(res.status).toBeLessThan(300));

    expect(refresh.body.accessToken).toBeDefined();
  });
});
