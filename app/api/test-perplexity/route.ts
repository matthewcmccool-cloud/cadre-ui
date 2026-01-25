import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: 'Say "hello" and nothing else' }],
    }),
  });

  const status = response.status;
  const text = await response.text();

  return NextResponse.json({
    status,
    body: text,
  });
}
