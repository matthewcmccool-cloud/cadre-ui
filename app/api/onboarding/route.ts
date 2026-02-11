import { NextResponse } from 'next/server';
import { getOnboardingData } from '@/lib/data';

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await getOnboardingData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch onboarding data:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding data' }, { status: 500 });
  }
}
