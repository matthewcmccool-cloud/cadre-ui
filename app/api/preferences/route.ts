import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// GET /api/preferences — fetch current user's alert preferences
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('alert_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }

  // Return defaults if no record exists
  if (!data) {
    return NextResponse.json({
      weeklyDigest: true,
      dailyDigest: false,
      dailyDigestTime: '09:00',
      realtimeNewRoles: true,
      realtimeFundraises: true,
      realtimeSurges: true,
      realtimeStalls: true,
      newsletter: true,
    });
  }

  return NextResponse.json({
    weeklyDigest: data.weekly_digest ?? true,
    dailyDigest: data.daily_digest ?? false,
    dailyDigestTime: data.daily_digest_time ?? '09:00',
    realtimeNewRoles: data.realtime_new_roles ?? true,
    realtimeFundraises: data.realtime_fundraises ?? true,
    realtimeSurges: data.realtime_surges ?? true,
    realtimeStalls: data.realtime_stalls ?? true,
    newsletter: data.newsletter ?? true,
  });
}

// PUT /api/preferences — update alert preferences
export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from('alert_preferences')
    .upsert(
      {
        user_id: userId,
        weekly_digest: body.weeklyDigest,
        daily_digest: body.dailyDigest,
        daily_digest_time: body.dailyDigestTime,
        realtime_new_roles: body.realtimeNewRoles,
        realtime_fundraises: body.realtimeFundraises,
        realtime_surges: body.realtimeSurges,
        realtime_stalls: body.realtimeStalls,
        newsletter: body.newsletter,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
