'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

export type UserStatus = 'free' | 'trial' | 'pro' | 'expired';

interface UserStatusContextValue {
  userStatus: UserStatus;
  isProAccess: boolean;
}

const UserStatusContext = createContext<UserStatusContextValue | null>(null);

/**
 * Maps the internal subscription status to the user-facing status values.
 * Sits alongside FollowsProvider and SubscriptionProvider — does NOT replace them.
 */
export function UserStatusProvider({ children }: { children: ReactNode }) {
  const { status } = useSubscription();

  // Map internal status → user-facing status
  let userStatus: UserStatus;
  switch (status) {
    case 'trialing':
      userStatus = 'trial';
      break;
    case 'active':
      userStatus = 'pro';
      break;
    case 'canceled':
    case 'past_due':
      userStatus = 'expired';
      break;
    default:
      userStatus = 'free';
  }

  const isProAccess = userStatus === 'trial' || userStatus === 'pro';

  return (
    <UserStatusContext.Provider value={{ userStatus, isProAccess }}>
      {children}
    </UserStatusContext.Provider>
  );
}

export function useUserStatus(): UserStatusContextValue {
  const context = useContext(UserStatusContext);
  if (!context) {
    throw new Error('useUserStatus must be used within a UserStatusProvider');
  }
  return context;
}
