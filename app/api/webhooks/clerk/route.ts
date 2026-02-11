import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle the event
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, primary_email_address_id } = evt.data;
    
    const primaryEmail = email_addresses.find(
      (email) => email.id === primary_email_address_id
    );

    if (primaryEmail) {
      const supabase = createSupabaseAdmin();

      // Create user record
      const { error } = await supabase
        .from('users')
        .insert({
          clerk_id: id,
          email: primaryEmail.email_address,
          plan: 'free',
        });

      if (error) {
        console.error('Error creating user in Supabase:', error);
        return new Response('Error creating user', { status: 500 });
      }

      // Create default alert preferences
      await supabase
        .from('alert_preferences')
        .upsert({ user_id: id }, { onConflict: 'user_id' });

      console.log(`User ${id} created in Supabase with default preferences`);
    }
  }

  return new Response('Webhook processed', { status: 200 });
}
