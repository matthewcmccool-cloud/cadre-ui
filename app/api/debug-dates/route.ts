import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const JOB_LISTINGS_TABLE_ID = 'tbl4HJr9bYCMOn2Ry';

export async function GET() {
  const params = new URLSearchParams();
  params.append('pageSize', '10');
  params.append('filterByFormula', 'FIND("Abnormal Security", ARRAYJOIN({Companies}, "||") & "")');
  params.append('sort[0][field]', 'Date Posted');
  params.append('sort[0][direction]', 'desc');
  params.append('fields[]', 'Title');
  params.append('fields[]', 'Companies');
  params.append('fields[]', 'Date Posted');
  params.append('fields[]', 'Raw JSON');

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${JOB_LISTINGS_TABLE_ID}?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });

  const text = await response.text();
  if (!response.ok) {
    return NextResponse.json({ error: text }, { status: 500 });
  }

  const data = JSON.parse(text);
  const results = data.records.map((record: any) => {
    const datePosted = record.fields['Date Posted'] || null;
    const airtableCreated = record.createdTime;
    let atsUpdatedAt = null;
    let atsCreatedAt = null;

    const rawStr = record.fields['Raw JSON'];
    if (rawStr) {
      try {
        const raw = JSON.parse(rawStr);
        atsUpdatedAt = raw.updated_at || null;
        atsCreatedAt = raw.created_at || raw.createdAt || null;
      } catch {}
    }

    return {
      title: record.fields['Title'],
      datePosted,
      airtableCreated,
      atsUpdatedAt,
      atsCreatedAt,
      match: datePosted === atsUpdatedAt ? 'updated_at' :
             datePosted === atsCreatedAt ? 'created_at' :
             datePosted === airtableCreated?.split('T')[0] ? 'SYNC DATE' : 'unknown',
    };
  });

  return NextResponse.json({ count: results.length, results });
}
