import { useCallback, useEffect, useState } from 'react';
import { tenantService } from '../services/tenant.service';
import { useAuth } from './useAuth';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export function useTenant() {
  const { isAuthenticated } = useAuth();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await tenantService.getMe();
      setTenant(data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tenant, loading, refresh };
}
