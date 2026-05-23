import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<string>();

export function getTenantId(): string | undefined {
  return tenantStorage.getStore();
}

export function withTenantFilter<T extends Record<string, unknown>>(
  tenantId: string,
  where: T = {} as T,
): T & { tenantId: string } {
  return { ...where, tenantId };
}
