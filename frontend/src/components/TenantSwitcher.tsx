import { useTenant } from '../hooks/useTenant';

export function TenantSwitcher() {
  const { tenant, loading } = useTenant();
  if (loading || !tenant) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
      <span className="text-slate-400">Workspace</span>
      <p className="font-medium text-white">{tenant.name}</p>
      <p className="text-xs text-slate-500 capitalize">{tenant.plan} plan</p>
    </div>
  );
}
