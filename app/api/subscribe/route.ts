export async function POST(request: Request) {
  const body = await request.text();
  const { email } = JSON.parse(body);

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 });
  }

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    // Graceful fallback when key isn't configured yet
    console.warn('LOOPS_API_KEY not set — email subscription skipped');
    return Response.json({ success: true });
  }

  try {
    const loopsRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        source: 'website',
        subscribed_date: new Date().toISOString(),
        subscriber_type: 'unknown',
      }),
    });

    if (!loopsRes.ok) {
      const errorText = await loopsRes.text();
      console.error('Loops.so error:', errorText);
      return Response.json({ error: 'Subscription failed' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return Response.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
