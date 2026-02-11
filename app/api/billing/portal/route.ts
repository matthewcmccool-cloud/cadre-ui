import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (!email) {
    return NextResponse.json({ error: 'No email found' }, { status: 400 });
  }

  try {
    // Find the Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    const customer = customers.data[0];

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${req.headers.get('origin')}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
