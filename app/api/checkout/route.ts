import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe, PRICE_IDS } from '@/lib/stripe';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  const body = await req.json();
  const priceKey = body.priceId as 'monthly' | 'annual';
  const priceId = PRICE_IDS[priceKey];

  if (!priceId) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId },
      },
      customer_email: email || undefined,
      metadata: { userId },
      success_url: `${req.headers.get('origin')}/settings/billing?trial=started`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
