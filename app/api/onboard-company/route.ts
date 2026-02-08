import { NextRequest, NextResponse } from 'next/server';
import { onboardCompany } from '@/lib/onboard-pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('id');

  if (!companyId) {
    return NextResponse.json(
      { error: 'Missing ?id= parameter. Pass an Airtable company record ID.' },
      { status: 400 }
    );
  }

  const result = await onboardCompany(companyId);

  return NextResponse.json(result, {
    status: result.success ? 200 : (result.statusCode || 500),
  });
}
