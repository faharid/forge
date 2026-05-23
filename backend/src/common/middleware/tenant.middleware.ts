import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../tenant-context';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    tenant_id: string;
    role: string;
  };
  tenantId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    const tenantId = req.user?.tenant_id;
    if (tenantId) {
      req.tenantId = tenantId;
      tenantStorage.run(tenantId, () => next());
    } else {
      next();
    }
  }
}
