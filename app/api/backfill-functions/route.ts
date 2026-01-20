export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  if (!perplexityKey) {
    return Response.json({ error: 'PERPLEXITY_API_KEY not set' });
  }

  // 1. Fetch all Functions
  const functionsRes = await fetch(
    `https://api.airtable.com/v0/${baseId}/tbl94EXkSIEmhqyYy?fields[]=Function`,
    { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' }
  );
  const functionsData = await functionsRes.json();
  
  const functionRecords = functionsData.records || [];
  const functionNames = functionRecords
    .map((r: any) => r.fields.Function)
    .filter(Boolean)
    .join(', ');

  // 2. Fetch jobs without Function (limit 10)
  const jobsRes = await fetch(
    `https://api.airtable.com/v0/${baseId}/Job%20Listings?maxRecords=10&fields[]=Title&fields[]=Function&filterByFormula=IF({Function}='',TRUE(),FALSE())`,
    { headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store' }
  );
  const jobsData = await jobsRes.json();
  
  const jobsToProcess = (jobsData.records || []).filter((r: any) => !r.fields.Function);

  if (jobsToProcess.length === 0) {
    return Response.json({ message: 'No jobs need backfill', processed: 0 });
  }

  const results: any[] = [];

  // 3. Process each job with AI
  for (const job of jobsToProcess) {
    const title = job.fields.Title || '';
    
    const prompt = `Given this job title: "${title}"

Classify it into exactly ONE of these categories: ${functionNames}

Respond with ONLY the category name, nothing else. Match the spelling exactly.`;

    try {
      const aiRes = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
        }),
      });
      
      // Get raw response text for debugging
      const responseText = await aiRes.text();
      
      // Try to parse as JSON
      let aiData;
      try {
        aiData = JSON.parse(responseText);
      } catch (parseError) {
        results.push({ 
          id: job.id, 
          title, 
          status: 'error', 
          error: 'Invalid JSON response',
          httpStatus: aiRes.status,
          rawResponse: responseText.substring(0, 500) 
        });
        continue;
      }
      
      // Check for API error response
      if (aiData.error) {
        results.push({ 
          id: job.id, 
          title, 
          status: 'error', 
          error: aiData.error.message || aiData.error,
          httpStatus: aiRes.status
        });
        continue;
      }
      
      const functionGuess = aiData.choices?.[0]?.message?.content?.trim();
      
      // Find matching function
      const matchedFunction = functionRecords.find(
        (r: any) => r.fields.Function?.toLowerCase() === functionGuess?.toLowerCase()
      );
      
      if (matchedFunction) {
        // Update Airtable
        await fetch(`https://api.airtable.com/v0/${baseId}/Job%20Listings/${job.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: { Function: [matchedFunction.id] }
          }),
        });
        
        results.push({ 
          id: job.id, 
          title, 
          classified: functionGuess, 
          matched: matchedFunction.fields.Function,
          status: 'updated' 
        });
      } else {
        results.push({ 
          id: job.id, 
          title, 
          classified: functionGuess, 
          status: 'no match' 
        });
      }
      
      // Rate limit: 2 second delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      results.push({ id: job.id, title, status: 'error', error: String(error) });
    }
  }

  return Response.json({
    processed: results.length,
    updated: results.filter(r => r.status === 'updated').length,
    results,
  });
}
