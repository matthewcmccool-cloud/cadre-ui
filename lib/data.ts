/**
 * Data abstraction layer — single import point for all data-fetching functions.
 *
 * DUAL-READ PATTERN:
 *   Currently reads from Airtable. To switch to Supabase as the primary data
 *   source, change the import below from './airtable' to './supabase-data'.
 *   Every page and API route imports from '@/lib/data' — no other files need
 *   to change when swapping backends.
 *
 * WHAT LIVES HERE vs. WHAT STAYS IN lib/airtable:
 *   This file re-exports every public function, type, and interface that pages
 *   and API routes consume. The underlying implementation (Airtable or Supabase)
 *   is an internal detail hidden behind this module boundary.
 */

// ── Data source ─────────────────────────────────────────────────────
// To switch from Airtable → Supabase, change this single import:
//   from './airtable'  →  from './supabase-data'
// ─────────────────────────────────────────────────────────────────────

// ── Data-fetching functions ──────────────────────────────────────────
export {
  // Jobs
  getJobs,
  getJobById,
  getOrganicJobs,
  getFeaturedJobs,
  getJobsByCompany,
  getJobsForCompanyNames,
  getJobsForCompanyIds,

  // Companies
  getCompanyBySlug,
  getAllCompaniesForDirectory,
  getRecentCompanies,
  getSimilarCompanies,

  // Investors
  getInvestorBySlug,
  getAllInvestorsForDirectory,

  // Industries
  getIndustryBySlug,

  // Fundraises
  getFundraises,

  // Discovery / Filters
  getFilterOptions,
  getStats,

  // Search
  searchAll,

  // Feed
  getFeedDataForCompanyIds,

  // Onboarding
  getOnboardingData,
} from './airtable';

// ── Utility functions (backend-agnostic) ─────────────────────────────
export { toSlug, inferFunction } from './airtable';

// ── Types & Interfaces ──────────────────────────────────────────────
export type {
  Job,
  JobsResult,
  FilterOptions,
  CompanyTickerItem,
  Company,
  Investor,
  Industry,
  CompanyDirectoryItem,
  InvestorDirectoryItem,
  FundraiseItem,
  RecentCompany,
  SimilarCompanyItem,
  OnboardingCompany,
  OnboardingInvestor,
  OnboardingData,
  FeedCompanyItem,
  FeedDataResult,
  SearchResult,
} from './airtable';
