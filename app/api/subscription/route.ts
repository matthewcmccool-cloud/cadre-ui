import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ status: 'free', isPro: false, isTrialing: false, trialDaysRemaining: null });
  }

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from('users')
    .select('plan, trial_ends_at')
    .eq('clerk_id', userId)
    .single();

  if (!data) {
    return NextResponse.json({ status: 'free', isPro: false, isTrialing: false, trialDaysRemaining: null });
  }

  let status: string = data.plan || 'free';
  let trialDaysRemaining: number | null = null;

  // Detect expired self-service trial
  if (status === 'trialing' && data.trial_ends_at) {
    const now = Date.now();
    const trialEnd = new Date(data.trial_ends_at).getTime();
    trialDaysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
    if (trialEnd <= now) {
      status = 'canceled';
      trialDaysRemaining = 0;
    }
  }

  const isPro = status === 'active' || status === 'trialing';
  const isTrialing = status === 'trialing';

  return NextResponse.json(
    { status, isPro, isTrialing, trialDaysRemaining },
    { headers: { 'Cache-Control': 'private, no-cache, no-store' } },
  );
}
