'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';

/**
 * Renders nothing visible — checks localStorage for the trial welcome flag
 * and shows a one-time toast when a new user has just completed onboarding.
 * Must live inside the ToastProvider tree.
 */
export default function TrialWelcomeToast() {
  const { toast } = useToast();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    try {
      const flag = localStorage.getItem('cadre_show_trial_welcome');
      if (!flag) return;
      firedRef.current = true;
      localStorage.removeItem('cadre_show_trial_welcome');
      // Small delay to let the page settle before showing the toast
      const timer = setTimeout(() => {
        toast({
          type: 'success',
          message: 'Welcome to Cadre Pro! Your 14-day free trial has started.',
          link: { text: 'View in For Me \u2192', href: '/for-me' },
        });
      }, 600);
      return () => clearTimeout(timer);
    } catch { /* ignore localStorage errors */ }
  }, [toast]);

  return null;
}
