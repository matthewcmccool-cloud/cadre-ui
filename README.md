# Cadre UI

The career graph for tech talent. Find jobs at 250+ venture-backed companies.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** Airtable
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Airtable account with job data

### Environment Variables

Create a `.env.local` file:

```bash
AIRTABLE_API_KEY=pat_your_api_key_here
AIRTABLE_BASE_ID=app_your_base_id_here
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel settings
4. Deploy

### Environment Variables for Vercel

Set these in Vercel project settings:

- `AIRTABLE_API_KEY` - Your Airtable personal access token
- `AIRTABLE_BASE_ID` - Your Airtable base ID (starts with "app")

## Project Structure

```
cadre-ui/
├── app/
│   ├── globals.css     # Global styles + Tailwind
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/
│   ├── Header.tsx      # Navigation + search
│   ├── Filters.tsx     # Filter dropdowns
│   └── JobTable.tsx    # Job listings table
├── lib/
│   └── airtable.ts     # Airtable API client
└── public/
```

## Features

### Current

- [x] Job listings table (date, title, company, investors, location)
- [x] Search by title/company
- [x] Filter by function
- [x] Filter by location
- [x] Remote only toggle
- [x] Filter by investor
- [x] Mobile responsive
- [x] Server-side caching (5 min)

### Planned

- [ ] Company pages
- [ ] Investor pages
- [ ] Email alerts
- [ ] User accounts
- [ ] Premium features
