import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from '../tenant-context';
import { AuthenticatedRequest } from '../middleware/tenant.middleware';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const tenantId = req.user?.tenant_id;
    if (tenantId) {
      req.tenantId = tenantId;
      return new Observable((subscriber) => {
        tenantStorage.run(tenantId, () => {
          next.handle().subscribe(subscriber);
        });
      });
    }
    return next.handle();
  }
}
