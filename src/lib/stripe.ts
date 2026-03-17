import Stripe from 'stripe';

// ── Stripe singleton (server-side only, lazy) ────────────────────────────────
// Using a lazy getter so the Stripe client is only instantiated at runtime
// (when STRIPE_SECRET_KEY is available), not at build time / static analysis.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
    });
  }
  return _stripe;
}

// Convenience alias used throughout the app
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ── Credit packages ──────────────────────────────────────────────────────────
export interface CreditPackage {
  id: 'starter' | 'growth' | 'pro';
  name: string;
  credits: number;
  price_gbp: number;
  per_credit: string;
  stripe_price_id: string;
  popular: boolean;
  time_saved: string;
  emoji: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    price_gbp: 9,
    per_credit: '1.80',
    stripe_price_id: process.env.STRIPE_PRICE_STARTER!,
    popular: false,
    time_saved: '~5 hours',
    emoji: '⚡',
  },
  {
    id: 'growth',
    name: 'Growth',
    credits: 10,
    price_gbp: 15,
    per_credit: '1.50',
    stripe_price_id: process.env.STRIPE_PRICE_GROWTH!,
    popular: true,
    time_saved: '~10 hours',
    emoji: '🚀',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 25,
    price_gbp: 29,
    per_credit: '1.16',
    stripe_price_id: process.env.STRIPE_PRICE_PRO!,
    popular: false,
    time_saved: '~25 hours',
    emoji: '💎',
  },
];
