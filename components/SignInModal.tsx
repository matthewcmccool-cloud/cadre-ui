'use client';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useState, useEffect, useCallback } from 'react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
}

export default function SignInModal({ isOpen, onClose, companyName }: SignInModalProps) {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const [emailInput, setEmailInput] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const headline = companyName
    ? `Follow ${companyName} and 1,300+ companies on Cadre`
    : 'Follow 1,300+ companies on Cadre';

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!signInLoaded || !signIn) return;
    setError('');
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sign-up/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch {
      setError('Could not connect to Google. Try again.');
    }
  }, [signIn, signInLoaded]);

  const handleEmailMagicLink = useCallback(async () => {
    if (!signUpLoaded || !signUp || !emailInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Try creating the sign-up first (new user)
      await signUp.create({
        emailAddress: emailInput.trim(),
      });
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_link',
        redirectUrl: `${window.location.origin}/`,
      });
      setEmailSent(true);
    } catch (err: unknown) {
      // If user already exists, try sign-in magic link instead
      if (signInLoaded && signIn) {
        try {
          const { supportedFirstFactors } = await signIn.create({
            identifier: emailInput.trim(),
          });
          const emailFactor = supportedFirstFactors?.find(
            (f: { strategy: string }) => f.strategy === 'email_link'
          );
          if (emailFactor && 'emailAddressId' in emailFactor) {
            await signIn.prepareFirstFactor({
              strategy: 'email_link',
              emailAddressId: emailFactor.emailAddressId as string,
              redirectUrl: `${window.location.origin}/`,
            });
            setEmailSent(true);
          } else {
            setError('Email sign-in not available. Try Google instead.');
          }
        } catch {
          setError('Something went wrong. Try again or use Google sign-in.');
        }
      } else {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [signUp, signUpLoaded, signIn, signInLoaded, emailInput]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md mx-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
            {headline}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Get weekly hiring updates for the companies you care about.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {emailSent ? (
            <div className="text-center py-4">
              <div className="text-emerald-400 text-sm font-medium">Check your email</div>
              <p className="mt-2 text-xs text-zinc-400">
                We sent a sign-in link to <span className="text-zinc-300">{emailInput}</span>
              </p>
            </div>
          ) : (
            <>
              {/* Google OAuth */}
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-3 w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Email magic link */}
              {showEmailInput ? (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEmailMagicLink();
                    }}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleEmailMagicLink}
                    disabled={loading || !emailInput.trim()}
                    className="w-full rounded-md bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send magic link'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEmailInput(true)}
                  className="flex items-center justify-center gap-3 w-full rounded-md border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Continue with email
                </button>
              )}
            </>
          )}

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-zinc-600">
          By creating an account you agree to our{' '}
          <a href="/terms" className="text-zinc-500 hover:text-zinc-300 underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-zinc-500 hover:text-zinc-300 underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
