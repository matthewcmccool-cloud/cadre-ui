'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { FollowsProvider } from '@/hooks/useFollows';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <FollowsProvider>
          {children}
        </FollowsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
