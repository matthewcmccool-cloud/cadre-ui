import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// DELETE /api/follows/[companyId] — unfollow a company
export async function DELETE(
  _req: Request,
  { params }: { params: { companyId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { companyId } = params;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('user_id', userId)
    .eq('company_id', companyId);

  if (error) {
    console.error('Error removing follow:', error);
    return NextResponse.json({ error: 'Failed to unfollow company' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
