'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'canceled' | 'past_due';

interface SubscriptionContextValue {
  status: SubscriptionStatus;
  isPro: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const FREE_STATE: SubscriptionContextValue = {
  status: 'free',
  isPro: false,
  isTrialing: false,
  trialDaysRemaining: null,
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [value, setValue] = useState<SubscriptionContextValue>(FREE_STATE);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setValue(FREE_STATE);
      return;
    }

    // Fetch real subscription status from API
    fetch('/api/subscription')
      .then((res) => res.json())
      .then((data) => {
        setValue({
          status: data.status || 'free',
          isPro: data.isPro ?? false,
          isTrialing: data.isTrialing ?? false,
          trialDaysRemaining: data.trialDaysRemaining ?? null,
        });
      })
      .catch(() => {
        setValue(FREE_STATE);
      });
  }, [isSignedIn, isLoaded]);

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
