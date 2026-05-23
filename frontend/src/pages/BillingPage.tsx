import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useTenant } from '../hooks/useTenant';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface SubscriptionResponse {
  plan: string;
  subscription: { status: string; currentPeriodEnd?: string } | null;
}

export function BillingPage() {
  const { get, post } = useApi();
  const { tenant, refresh } = useTenant();
  const [params] = useSearchParams();
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const checkoutStatus = params.get('checkout');

  useEffect(() => {
    get<SubscriptionResponse>('/billing/subscription')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [get]);

  useEffect(() => {
    if (checkoutStatus === 'success') {
      refresh();
    }
  }, [checkoutStatus, refresh]);

  const handleUpgrade = async (plan: 'starter' | 'pro') => {
    const { data: session } = await post<{ url: string }>('/billing/checkout', { plan });
    if (session.url) window.location.href = session.url;
  };

  const handlePortal = async () => {
    try {
      const { data: session } = await post<{ url: string }>('/billing/portal');
      if (session.url) window.location.href = session.url;
    } catch {
      alert('Subscribe first to manage billing.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold">Billing</h2>
      {checkoutStatus === 'success' && (
        <p className="mt-2 text-sm text-green-400">Subscription updated successfully.</p>
      )}
      {checkoutStatus === 'canceled' && (
        <p className="mt-2 text-sm text-amber-400">Checkout was canceled.</p>
      )}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-slate-400">Current plan</p>
        <p className="text-3xl font-bold capitalize">{data?.plan ?? tenant?.plan ?? 'free'}</p>
        {data?.subscription && (
          <p className="mt-2 text-sm text-slate-500">
            Status: {data.subscription.status}
          </p>
        )}
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => handleUpgrade('starter')}
          className="rounded-lg bg-indigo-600 px-6 py-2 hover:bg-indigo-500"
        >
          Upgrade to Starter
        </button>
        <button
          type="button"
          onClick={() => handleUpgrade('pro')}
          className="rounded-lg bg-violet-600 px-6 py-2 hover:bg-violet-500"
        >
          Upgrade to Pro
        </button>
        <button
          type="button"
          onClick={handlePortal}
          className="rounded-lg border border-slate-600 px-6 py-2 hover:border-slate-400"
        >
          Manage subscription
        </button>
      </div>
    </div>
  );
}
