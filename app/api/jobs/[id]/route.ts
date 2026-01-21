import { NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: 'Missing Airtable credentials' }, { status: 500 });
  }

  try {
    // Fetch the job record by ID
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Job%20Listings/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      throw new Error(`Airtable error: ${response.status}`);
    }

    const data = await response.json();
    const fields = data.fields;

    const job = {
      id: data.id,
      jobId: fields['Job ID'] || '',
      title: fields['Title'] || '',
      company: fields['Company'] || '',
      companyUrl: fields['Company URL'] || '',
      investors: fields['Investors'] || [],
      location: fields['Location'] || '',
      remoteFirst: fields['Remote First'] || false,
      functionName: fields['Function'] || '',
      industry: fields['Industry'] || '',
      datePosted: fields['Date Posted'] || '',
      jobUrl: fields['Job URL'] || '',
      applyUrl: fields['Apply URL'] || '',
      salary: fields['Salary'] || '',
      description: fields['Description'] || '',
    };

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}
