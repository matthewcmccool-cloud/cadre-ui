'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SignInModal from '@/components/SignInModal';
import OnboardingModal from '@/components/OnboardingModal';
import { trackSignUp, trackSignIn } from '@/lib/analytics';

interface SignInContext {
  companyName?: string;
  companyId?: string;
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [signInContext, setSignInContext] = useState<SignInContext>({});
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [pendingFollowCompanyId, setPendingFollowCompanyId] = useState<string | null>(null);
  const signInTrackedRef = useRef(false);

  // Track sign_in for returning users (fires once per session)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || signInTrackedRef.current) return;
    if (searchParams.get('onboarding') === 'true') return; // new signup, not sign_in
    signInTrackedRef.current = true;
    trackSignIn();
  }, [isLoaded, isSignedIn, searchParams]);

  const openSignIn = useCallback((context?: SignInContext) => {
    setSignInContext(context || {});
    // Store pending follow company in localStorage for post-signup onboarding
    if (context?.companyId) {
      try {
        localStorage.setItem('cadre_pending_follow', context.companyId);
      } catch { /* ignore */ }
    }
    setModalOpen(true);
  }, []);

  // Detect ?onboarding=true after sign-up redirect
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (searchParams.get('onboarding') === 'true') {
      trackSignUp();
      // Read pending follow from localStorage
      try {
        const pending = localStorage.getItem('cadre_pending_follow');
        if (pending) {
          setPendingFollowCompanyId(pending);
          localStorage.removeItem('cadre_pending_follow');
        }
        // Flag for welcome toast (consumed by TrialWelcomeToast after onboarding)
        localStorage.setItem('cadre_show_trial_welcome', 'true');
      } catch { /* ignore */ }
      setOnboardingOpen(true);
      // Clean the URL param
      const url = new URL(window.location.href);
      url.searchParams.delete('onboarding');
      router.replace(url.pathname + url.search);
    }
  }, [isLoaded, isSignedIn, searchParams, router]);

  const handleOnboardingClose = useCallback(() => {
    setOnboardingOpen(false);
    setPendingFollowCompanyId(null);
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
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={handleOnboardingClose}
        pendingFollowCompanyId={pendingFollowCompanyId}
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
