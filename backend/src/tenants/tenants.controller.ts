import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { InviteDto } from './dto/invite.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/rbac.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { UserRole } from '../common/constants';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('me')
  getMe(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getMe(tenantId);
  }

  @Put('me')
  updateMe(@CurrentTenant() tenantId: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.updateMe(tenantId, dto);
  }

  @Post('me/invite')
  @Roles(UserRole.ADMIN)
  invite(@CurrentTenant() tenantId: string, @Body() dto: InviteDto) {
    return this.tenantsService.invite(tenantId, dto);
  }
}
