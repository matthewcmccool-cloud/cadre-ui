name: cadre-api-conventions
description: Use when building or modifying CADRE API endpoints, route handlers, response formats, or error handling. Covers endpoint structure, auth, rate limiting, response shapes, and the tiered access model.

# CADRE API Conventions

## Overview

CADRE exposes a RESTful API at `api.cadre.careers` (v1) providing structured access to hiring intelligence data — jobs, companies, investors, funding rounds, and signals across VC-backed companies.

## Base URL & Versioning

```
https://api.cadre.careers/v1/{resource}
```

All endpoints are versioned under `/v1/`. No unversioned routes.

## Authentication

Bearer token via Authorization header:

```
Authorization: Bearer cadre_sk_xxx
```

API keys are prefixed `cadre_sk_` and scoped to a pricing tier.

## Pricing Tiers & Access

| Tier | Price | Rate Limit | Access |
|------|-------|------------|--------|
| Signal | $499/mo | 60 req/min | Jobs, companies, basic filters |
| Intelligence | $1,499/mo | 200 req/min | Full graph, funding, investor data, signals |
| Enterprise | Custom | Custom | Webhooks, bulk export, dedicated support |

Rate limit headers on every response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 2026-02-15T00:00:00Z
```

## Core Endpoints

```
GET /v1/companies         — list/filter companies
GET /v1/companies/:id     — single company detail
GET /v1/jobs              — list/filter jobs
GET /v1/jobs/:id          — single job detail
GET /v1/investors         — list/filter investors
GET /v1/investors/:id     — single investor + portfolio
GET /v1/funding           — recent funding rounds
GET /v1/signals           — hiring signals and anomalies
```

## Response Shape

All successful responses follow this structure:

```json
{
  "count": 47,
  "{resource}": [
    { ... }
  ]
}
```

The array key matches the resource name (companies, jobs, rounds, etc.).

Single resource:

```json
{
  "company": { ... }
}
```

## Common Query Parameters

| Param | Type | Used on | Description |
|-------|------|---------|-------------|
| industry | string | companies, jobs, funding | Filter by industry slug |
| stage | string | companies | seed, series-a, series-b, etc. |
| ats_platform | string | companies, jobs | greenhouse, lever, ashby |
| investor | string | companies, funding | Investor name or ID |
| round_type | string | funding | seed, series-a, series-b, series-c, series-d |
| recency | string | funding, signals | 30d, 90d, 180d |
| function | string | jobs | engineering, product, design, etc. |
| location | string | companies, jobs | Free text location filter |
| limit | int | all | Results per page (default 25, max 100) |
| offset | int | all | Pagination offset |

## Error Response Shape

All errors return a consistent structure:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "You've exceeded 60 requests per minute. Upgrade to Growth for higher limits.",
    "status": 429
  }
}
```

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | invalid_request | Malformed request or invalid parameters |
| 401 | unauthorized | Missing or invalid API key |
| 403 | forbidden | API key lacks permission for this resource |
| 404 | not_found | Resource doesn't exist |
| 429 | rate_limit_exceeded | Too many requests |
| 500 | internal_error | Something went wrong on our end |

## ID Format

Resource IDs use short prefixed strings in API responses:

- Companies: `comp_abc123`
- Jobs: `job_def456`
- Investors: `inv_ghi789`

Internally these map to UUIDs in Supabase.

## Route Handler Pattern

All API routes follow this structure:

```typescript
export async function GET(req: Request) {
  try {
    // 1. Validate API key from Authorization header
    // 2. Check tier access and rate limits
    // 3. Parse and validate query params
    // 4. Query Supabase via service role client
    // 5. Transform internal UUIDs to prefixed IDs
    // 6. Return shaped response with rate limit headers
  } catch (error) {
    // Return error shape with appropriate status code
  }
}
```

## Design Principles

- Jobs are the primary signal — the most honest forward-looking indicator companies emit
- Data should be legible and structured — no raw dumps
- The API democratizes VC information asymmetry
- Response times under 200ms for filtered queries
- Never expose internal UUIDs, Supabase structure, or service keys in responses
