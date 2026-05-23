import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant, Subscription } from '../database/entities';
import { TenantsModule } from '../tenants/tenants.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Subscription]), TenantsModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
