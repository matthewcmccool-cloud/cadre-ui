import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// DELETE /api/account — delete user account and all data
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  try {
    // Delete follows
    await supabase.from('follows').delete().eq('user_id', userId);

    // Delete alert preferences
    await supabase.from('alert_preferences').delete().eq('user_id', userId);

    // Delete user record
    await supabase.from('users').delete().eq('clerk_id', userId);

    // Delete from Clerk
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
