// Analytics utility — wraps Plausible custom events.
// All event calls go through this module so the provider
// can be swapped later without touching individual components.

type EventProperties = Record<string, string | number | boolean>;

// ── UTM helpers ─────────────────────────────────────────────────
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
const UTM_STORAGE_KEY = 'cadre_utm';

/** Call once on first page load to capture UTM params from the URL. */
export function captureUtmParams(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    let found = false;
    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val) {
        utm[key] = val;
        found = true;
      }
    }
    if (found) {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    }
  } catch { /* localStorage unavailable */ }
}

/** Retrieve stored UTM params (for attaching to conversion events). */
export function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── Core event dispatch ─────────────────────────────────────────
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProperties }) => void;
  }
}

function track(event: string, props?: EventProperties): void {
  if (typeof window === 'undefined') return;
  // Plausible custom events
  window.plausible?.(event, props ? { props } : undefined);

  // Dev: log to console so events can be verified
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props || '');
  }
}

// ── Named event helpers ─────────────────────────────────────────

export function trackSignUp(): void {
  track('sign_up', getUtmParams());
}

export function trackSignIn(): void {
  track('sign_in');
}

export function trackFollowCompany(companyId: string): void {
  track('follow_company', { company_id: companyId });
}

export function trackUnfollowCompany(companyId: string): void {
  track('unfollow_company', { company_id: companyId });
}

export function trackFollowPortfolio(investorSlug: string): void {
  track('follow_portfolio', { investor_id: investorSlug });
}

export function trackViewCompany(companyId: string): void {
  track('view_company', { company_id: companyId });
}

export function trackViewInvestor(investorSlug: string): void {
  track('view_investor', { investor_id: investorSlug });
}

export function trackClickApply(jobId: string, company: string): void {
  track('click_apply', { job_id: jobId, company });
}

export function trackStartTrial(): void {
  track('start_trial', getUtmParams());
}

export function trackSubscribe(): void {
  track('subscribe', getUtmParams());
}

export function trackNewsletterSignup(): void {
  track('newsletter_signup');
}

export function trackSearch(query: string): void {
  track('search', { query });
}

export function trackUpgradePromptShown(): void {
  track('upgrade_prompt_shown');
}

export function trackUpgradePromptClicked(): void {
  track('upgrade_prompt_clicked');
}
