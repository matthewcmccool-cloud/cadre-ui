export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  
  // Check if env vars exist
  if (!apiKey) {
    return Response.json({ error: 'AIRTABLE_API_KEY is not set' });
  }
  if (!baseId) {
    return Response.json({ error: 'AIRTABLE_BASE_ID is not set' });
  }
  
  // Log partial key for debugging (first 20 chars only)
  const partialKey = apiKey.substring(0, 20) + '...';
  
  // Try to fetch from Airtable
  try {
    const url = `https://api.airtable.com/v0/${baseId}/Job%20Listings?maxRecords=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    const status = response.status;
    const data = await response.json();
    
    return Response.json({
      success: status === 200,
      status: status,
      partialKey: partialKey,
      baseId: baseId,
      response: data,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
      partialKey: partialKey,
      baseId: baseId,
    });
  }
}
