import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

export interface JwtPayload {
  sub: string;
  email: string;
  tenant_id: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new Error('User not authenticated');
    }
    return request.user as JwtPayload;
  },
);
