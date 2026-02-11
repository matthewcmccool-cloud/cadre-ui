export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey) {
    return Response.json({ error: 'AIRTABLE_API_KEY is not set' });
  }
  if (!baseId) {
    return Response.json({ error: 'AIRTABLE_BASE_ID is not set' });
  }

  try {
    // Test Function table (using table ID)
    const functionTableId = 'tbl94EXkSIEmhqyYy';
    const functionUrl = `https://api.airtable.com/v0/${baseId}/${functionTableId}?maxRecords=5`;
    const functionResponse = await fetch(functionUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const functionText = await functionResponse.text();
    const functionData = JSON.parse(functionText);

    // Test Jobs with Function field
    const jobUrl = `https://api.airtable.com/v0/${baseId}/Jobs?maxRecords=5&fields%5B%5D=Title&fields%5B%5D=Function&fields%5B%5D=Company`;
    const jobResponse = await fetch(jobUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const jobText = await jobResponse.text();
    const jobData = JSON.parse(jobText);

    return Response.json({
      success: true,
      functionTable: {
        status: functionResponse.status,
        recordCount: functionData.records?.length || 0,
        sampleRecord: functionData.records?.[0] || null,
        allFieldNames: functionData.records?.[0] ? Object.keys(functionData.records[0].fields) : [],
      },
      jobsWithFunction: {
        status: jobResponse.status,
        records: jobData.records?.map((r: any) => ({
          id: r.id,
          title: r.fields?.Title,
          function: r.fields?.Function,
          company: r.fields?.Company,
        })) || [],
      },
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}
