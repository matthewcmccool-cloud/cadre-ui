import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// DELETE /api/bookmarks/[id] — remove a bookmark
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const supabase = createSupabaseAdmin();

  // Verify bookmark belongs to user then delete
  const { error } = await supabase
    .from('user_bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
