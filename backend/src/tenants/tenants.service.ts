import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Tenant } from '../database/entities/tenant.entity';
import { TenantInvite } from '../database/entities/tenant-invite.entity';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { InviteDto } from './dto/invite.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant) private tenantsRepo: Repository<Tenant>,
    @InjectRepository(TenantInvite) private invitesRepo: Repository<TenantInvite>,
  ) {}

  async getMe(tenantId: string) {
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      stripeCustomerId: tenant.stripeCustomerId,
      createdAt: tenant.createdAt,
    };
  }

  async updateMe(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (dto.name) tenant.name = dto.name;
    await this.tenantsRepo.save(tenant);
    return this.getMe(tenantId);
  }

  async invite(tenantId: string, dto: InviteDto) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = this.invitesRepo.create({
      tenantId,
      email: dto.email,
      token,
      expiresAt,
    });
    await this.invitesRepo.save(invite);

    const inviteUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/signup?invite=${token}`;
    console.log(`[INVITE] ${dto.email} -> ${inviteUrl}`);

    return {
      id: invite.id,
      email: invite.email,
      expiresAt: invite.expiresAt,
      inviteUrl,
    };
  }

  async findById(id: string) {
    return this.tenantsRepo.findOne({ where: { id } });
  }

  async updateStripeCustomer(tenantId: string, stripeCustomerId: string) {
    await this.tenantsRepo.update(tenantId, { stripeCustomerId });
  }

  async updatePlan(tenantId: string, plan: string) {
    await this.tenantsRepo.update(tenantId, { plan });
  }
}
