import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Tenant, User, Subscription, TenantInvite } from './entities';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgresql://postgres:dev@localhost:5432/forge_dev',
  entities: [Tenant, User, Subscription, TenantInvite],
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/database/migrations/*.js'
      : 'src/database/migrations/*.ts',
  ],
  synchronize: false,
});
