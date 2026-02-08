import { NextResponse } from 'next/server';
import {
  onboardCompany,
  findNextUnprocessedCompany,
  airtableFetch,
} from '@/lib/onboard-pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMPANIES_TABLE = 'tbl4dA7iDr7mjF6Gt';

/**
 * GET /api/onboard-batch
 *
 * Finds the next company without a Jobs API URL and runs the full onboarding
 * pipeline (ATS detection → job sync → metadata enrichment).
 *
 * Designed to be called by a Vercel Cron or a simple loop:
 *   while curl -s .../api/onboard-batch | jq -e '.hasMore'; do sleep 2; done
 *
 * If ATS detection fails, marks the company with Jobs API URL = "none"
 * so it won't be retried on the next call.
 */
export async function GET() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    return NextResponse.json(
      { error: 'Missing Airtable env vars' },
      { status: 500 }
    );
  }

  try {
    // Find next company to process
    const next = await findNextUnprocessedCompany();

    if (!next) {
      return NextResponse.json({
        success: true,
        hasMore: false,
        message: 'All companies have been processed. Nothing left to onboard.',
      });
    }

    // Run the full onboarding pipeline
    const result = await onboardCompany(next.id, 8000);

    // If ATS detection failed, mark company so it's not retried
    if (result.atsNotFound) {
      try {
        await airtableFetch(
          `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${COMPANIES_TABLE}/${next.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ fields: { 'Jobs API URL': 'none' } }),
          }
        );
        result.steps.push('Marked company with Jobs API URL = "none" (no supported ATS found)');
      } catch (markErr) {
        console.error('Failed to mark company as no-ATS:', markErr);
      }
    }

    // Check if there are still more companies to process
    // (the one we just processed is no longer blank, so hasMore reflects remaining)
    const hasMore = next.hasMore;

    return NextResponse.json({
      ...result,
      hasMore,
      message: hasMore
        ? `Processed "${next.name}". More companies remaining — call again to continue.`
        : `Processed "${next.name}". This was the last unprocessed company.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
