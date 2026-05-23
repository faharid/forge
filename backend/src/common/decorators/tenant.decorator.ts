import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = request.tenantId ?? request.user?.tenant_id;
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return tenantId;
  },
);
