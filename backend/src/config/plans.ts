export type PlanId = 'free' | 'starter' | 'pro';

export interface PlanConfig {
  id: PlanId;
  name: string;
  stripePriceEnvKey?: 'STRIPE_PRICE_STARTER' | 'STRIPE_PRICE_PRO';
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: { id: 'free', name: 'Free' },
  starter: { id: 'starter', name: 'Starter', stripePriceEnvKey: 'STRIPE_PRICE_STARTER' },
  pro: { id: 'pro', name: 'Pro', stripePriceEnvKey: 'STRIPE_PRICE_PRO' },
};
