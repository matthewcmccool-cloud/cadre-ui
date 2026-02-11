import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getInvestorBySlug, toSlug } from '@/lib/data';

// POST /api/follows/portfolio — body: { investorId }
// Looks up all companies for that investor in Airtable,
// creates follows for each, returns count of new follows added.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { investorId } = body;

  if (!investorId) {
    return NextResponse.json({ error: 'investorId is required' }, { status: 400 });
  }

  // investorId here is the investor slug — look up the investor and get portfolio companies
  const investor = await getInvestorBySlug(investorId);
  if (!investor) {
    return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
  }

  if (investor.companies.length === 0) {
    return NextResponse.json({ success: true, newFollows: 0, investorName: investor.name });
  }

  const supabase = createSupabaseAdmin();

  // Build follow rows for all portfolio companies
  const followRows = investor.companies.map((company) => ({
    user_id: userId,
    company_id: company.id,
    source: 'portfolio' as const,
    portfolio_investor_id: investor.id,
  }));

  // Upsert all — existing follows are ignored (no duplicate error)
  const { error } = await supabase
    .from('follows')
    .upsert(followRows, { onConflict: 'user_id,company_id', ignoreDuplicates: true });

  if (error) {
    console.error('Error creating portfolio follows:', error);
    return NextResponse.json({ error: 'Failed to follow portfolio' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    newFollows: investor.companies.length,
    investorName: investor.name,
  });
}
