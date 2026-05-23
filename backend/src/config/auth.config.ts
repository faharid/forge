import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiry: process.env.JWT_EXPIRY ?? '24h',
  refreshSecret: process.env.REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
  refreshExpiry: process.env.REFRESH_EXPIRY ?? '7d',
}));
