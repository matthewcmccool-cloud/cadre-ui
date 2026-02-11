import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseAdmin } from '@/lib/supabase';
import { triggerEvent, addTag, removeTag } from '@/lib/loops';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        let plan: string;
        if (subscription.status === 'trialing') {
          plan = 'trialing';
        } else if (subscription.status === 'active') {
          plan = 'active';
        } else if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
          plan = 'canceled';
        } else if (subscription.status === 'past_due') {
          plan = 'past_due';
        } else {
          plan = subscription.status;
        }

        await supabase
          .from('users')
          .update({
            plan,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
          .eq('clerk_id', userId);

        // Trigger Loops transactional emails based on plan state
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('clerk_id', userId)
          .single();

        if (userData?.email) {
          if (plan === 'trialing') {
            const trialEnd = subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : '';
            await triggerEvent(userData.email, 'trial_started', { trialEndsAt: trialEnd });
          } else if (plan === 'active') {
            await triggerEvent(userData.email, 'subscription_confirmed');
            await addTag(userData.email, 'pro');
          } else if (plan === 'canceled') {
            await removeTag(userData.email, 'pro');
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await supabase
          .from('users')
          .update({ plan: 'free', trial_ends_at: null })
          .eq('clerk_id', userId);

        // Remove pro tag in Loops
        const { data: deletedUser } = await supabase
          .from('users')
          .select('email')
          .eq('clerk_id', userId)
          .single();
        if (deletedUser?.email) {
          await removeTag(deletedUser.email, 'pro');
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // In 2026-01-28.clover API, subscription is under parent.subscription_details
        const subDetails = invoice.parent?.subscription_details;
        const subscriptionId = subDetails
          ? (typeof subDetails.subscription === 'string'
            ? subDetails.subscription
            : subDetails.subscription?.id)
          : null;

        if (subscriptionId) {
          await supabase
            .from('users')
            .update({ plan: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);

        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
