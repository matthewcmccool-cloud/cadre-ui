'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import SignInModal from '@/components/SignInModal';

interface SignInContext {
  companyName?: string;
}

interface AuthContextValue {
  user: ReturnType<typeof useUser>['user'];
  isSignedIn: boolean;
  isLoaded: boolean;
  openSignIn: (context?: SignInContext) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();
  const [modalOpen, setModalOpen] = useState(false);
  const [signInContext, setSignInContext] = useState<SignInContext>({});

  const openSignIn = useCallback((context?: SignInContext) => {
    setSignInContext(context || {});
    setModalOpen(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    await clerk.signOut();
  }, [clerk]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isSignedIn: isSignedIn ?? false,
        isLoaded: isLoaded ?? false,
        openSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
      <SignInModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        companyName={signInContext.companyName}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
