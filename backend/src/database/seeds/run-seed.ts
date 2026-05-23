import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import dataSource from '../data-source';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { Subscription } from '../entities/subscription.entity';
import { TenantInvite } from '../entities/tenant-invite.entity';
import { DEFAULT_SEED_PASSWORD, SEED_TENANTS } from './seed-data';

dotenv.config();

const SALT_ROUNDS = 12;
const isFresh = process.argv.includes('--fresh');

async function truncateAll(): Promise<void> {
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    await qr.query(
      'TRUNCATE TABLE tenant_invites, subscriptions, users, tenants RESTART IDENTITY CASCADE',
    );
    await qr.commitTransaction();
    console.log('Cleared all seed tables.');
  } catch (err) {
    await qr.rollbackTransaction();
    throw err;
  } finally {
    await qr.release();
  }
}

async function seed(): Promise<void> {
  const password = process.env.SEED_PASSWORD ?? DEFAULT_SEED_PASSWORD;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const tenantsRepo = dataSource.getRepository(Tenant);
  const usersRepo = dataSource.getRepository(User);
  const subsRepo = dataSource.getRepository(Subscription);
  const invitesRepo = dataSource.getRepository(TenantInvite);

  const createdAccounts: Array<{ tenant: string; email: string; role: string }> = [];

  for (const def of SEED_TENANTS) {
    let tenant = await tenantsRepo.findOne({ where: { slug: def.slug } });

    if (!tenant) {
      tenant = tenantsRepo.create({
        name: def.name,
        slug: def.slug,
        plan: def.plan,
      });
      await tenantsRepo.save(tenant);
      console.log(`+ Tenant: ${def.name} (${def.slug})`);
    } else {
      tenant.name = def.name;
      tenant.plan = def.plan;
      await tenantsRepo.save(tenant);
      console.log(`~ Tenant: ${def.name} (${def.slug})`);
    }

    let sub = await subsRepo.findOne({ where: { tenantId: tenant.id } });
    if (!sub) {
      sub = subsRepo.create({
        tenantId: tenant.id,
        status: def.subscriptionStatus ?? 'inactive',
      });
      await subsRepo.save(sub);
      console.log(`  + Subscription: ${sub.status}`);
    } else {
      sub.status = def.subscriptionStatus ?? sub.status;
      await subsRepo.save(sub);
    }

    for (const userDef of def.users) {
      const existing = await usersRepo.findOne({
        where: { tenantId: tenant.id, email: userDef.email },
      });

      if (!existing) {
        const user = usersRepo.create({
          email: userDef.email,
          passwordHash,
          tenantId: tenant.id,
          role: userDef.role,
        });
        await usersRepo.save(user);
        console.log(`  + User: ${userDef.email} (${userDef.role})`);
        createdAccounts.push({
          tenant: def.name,
          email: userDef.email,
          role: userDef.role,
        });
      } else {
        existing.passwordHash = passwordHash;
        existing.role = userDef.role;
        await usersRepo.save(existing);
        console.log(`  ~ User: ${userDef.email} (${userDef.role})`);
        createdAccounts.push({
          tenant: def.name,
          email: userDef.email,
          role: userDef.role,
        });
      }
    }

    // Pending invite for Acme only (demo)
    if (def.slug === 'acme-demo') {
      const inviteEmail = 'pending@acme.dev';
      const existingInvite = await invitesRepo.findOne({
        where: { tenantId: tenant.id, email: inviteEmail },
      });
      if (!existingInvite) {
        const invite = invitesRepo.create({
          tenantId: tenant.id,
          email: inviteEmail,
          token: randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        await invitesRepo.save(invite);
        console.log(`  + Invite: ${inviteEmail} (token in DB)`);
      }
    }
  }

  console.log('\n--- Seed complete ---');
  console.log(`Password for all users: ${password}`);
  console.log('\nLogin (Insomnia / POST /api/auth/login):\n');
  for (const acc of createdAccounts) {
    console.log(`  ${acc.email}  (${acc.tenant}, ${acc.role})`);
  }
  console.log('');
}

async function main(): Promise<void> {
  console.log('Forge database seed\n');
  await dataSource.initialize();

  if (isFresh) {
    await truncateAll();
  }

  await seed();
  await dataSource.destroy();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
