import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { validationPipe } from '../src/common/pipes/validation.pipe';

async function signupUser(app: INestApplication, label: string) {
  const email = `${label}-${Date.now()}@example.com`;
  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({ email, password: 'password123', tenantName: `${label} Inc` });
  return { email, token: res.body.accessToken as string };
}

describe('Multi-tenant isolation (e2e)', () => {
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

  it('tenant A cannot see tenant B users', async () => {
    const userA = await signupUser(app, 'tenantA');
    const userB = await signupUser(app, 'tenantB');

    const usersA = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${userA.token}`)
      .expect(200);

    const usersB = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${userB.token}`)
      .expect(200);

    expect(usersA.body.length).toBe(1);
    expect(usersB.body.length).toBe(1);
    expect(usersA.body[0].email).toBe(userA.email);
    expect(usersB.body[0].email).toBe(userB.email);
  });
});
