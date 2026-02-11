'use client';

import { createContext, useContext, type ReactNode } from 'react';

type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'canceled' | 'past_due';

interface SubscriptionContextValue {
  status: SubscriptionStatus;
  isPro: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

/**
 * SubscriptionProvider — stub for now.
 * Hardcoded to free tier. Prompt 13 wires this to Stripe.
 */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // TODO: Prompt 13 — fetch real subscription status from Stripe via API
  const value: SubscriptionContextValue = {
    status: 'free',
    isPro: false,
    isTrialing: false,
    trialDaysRemaining: null,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
