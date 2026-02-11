import { createContact } from '@/lib/loops';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit: 5 requests per IP per minute
  const ip = getClientIp(request);
  const rl = rateLimit(`subscribe:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } },
    );
  }

  const body = await request.text();
  const { email } = JSON.parse(body);

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 });
  }

  try {
    const result = await createContact(
      email,
      { source: 'website' },
      ['newsletter'],
    );

    if (!result.ok) {
      return Response.json({ error: 'Subscription failed' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return Response.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
