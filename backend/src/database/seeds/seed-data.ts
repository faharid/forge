import { UserRole } from '../../common/constants';

export interface SeedUserDef {
  email: string;
  role: UserRole;
}

export interface SeedTenantDef {
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro';
  users: SeedUserDef[];
  subscriptionStatus?: string;
}

/** Default password — override with SEED_PASSWORD env */
export const DEFAULT_SEED_PASSWORD = 'password123';

export const SEED_TENANTS: SeedTenantDef[] = [
  {
    name: 'Acme Inc',
    slug: 'acme-demo',
    plan: 'free',
    subscriptionStatus: 'inactive',
    users: [
      { email: 'admin@acme.dev', role: UserRole.ADMIN },
      { email: 'member@acme.dev', role: UserRole.MEMBER },
    ],
  },
  {
    name: 'Beta Labs',
    slug: 'beta-demo',
    plan: 'starter',
    subscriptionStatus: 'active',
    users: [
      { email: 'admin@beta.dev', role: UserRole.ADMIN },
      { email: 'member@beta.dev', role: UserRole.MEMBER },
    ],
  },
];
