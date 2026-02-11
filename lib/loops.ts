/**
 * Loops.so Email Integration — lib/loops.ts
 *
 * Setup requirements:
 * ─────────────────
 * 1. Create a Loops.so account at https://loops.so
 * 2. Generate an API key under Settings → API
 * 3. Set LOOPS_API_KEY in your .env.local
 *
 * Loops configuration needed:
 * ─────────────────────────────
 * Transactional emails (create in Loops dashboard):
 *   • "welcome"           — triggered on user.created (Clerk webhook)
 *   • "trial_started"     — triggered when user starts Pro trial
 *   • "trial_ending"      — scheduled 3 days before trial_end (Loops workflow)
 *   • "trial_expired"     — scheduled on trial_end date (Loops workflow)
 *   • "subscription_confirmed" — triggered when subscription becomes active
 *
 * Contact properties (create in Loops dashboard):
 *   • firstName (string)
 *   • source   (string)  — "website", "signup", "checkout"
 *   • plan     (string)  — "free", "trialing", "active", "canceled"
 *   • clerkId  (string)  — Clerk user ID for cross-referencing
 *   • trialEndsAt (date) — trial expiration date (for scheduled workflows)
 *
 * Tags used:
 *   • "newsletter"          — opted in via /api/subscribe
 *   • "user_no_newsletter"  — signed up but not newsletter-subscribed
 *   • "pro"                 — active Pro subscriber
 */

const LOOPS_BASE_URL = 'https://app.loops.so/api/v1';

function getApiKey(): string | null {
  return process.env.LOOPS_API_KEY || null;
}

async function loopsFetch(path: string, body: Record<string, unknown>): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn(`[loops] LOOPS_API_KEY not set — skipping ${path}`);
    return { ok: true };
  }

  try {
    const res = await fetch(`${LOOPS_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[loops] ${path} failed (${res.status}):`, text);
      return { ok: false, error: text };
    }

    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    console.error(`[loops] ${path} error:`, err);
    return { ok: false, error: String(err) };
  }
}

// ── Public API ────────────────────────────────────────────────────

export interface ContactProperties {
  firstName?: string;
  source?: string;
  plan?: string;
  clerkId?: string;
  trialEndsAt?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Create or update a contact in Loops.
 * If the contact already exists (by email), it will be updated.
 */
export async function createContact(
  email: string,
  properties: ContactProperties = {},
  tags: string[] = [],
): Promise<{ ok: boolean }> {
  // Build mailingLists / tags payload
  const body: Record<string, unknown> = {
    email,
    ...properties,
  };

  const result = await loopsFetch('/contacts/create', body);

  // Add tags separately (Loops tags API is per-tag)
  if (result.ok && tags.length > 0) {
    await Promise.all(tags.map((tag) => addTag(email, tag)));
  }

  return { ok: result.ok };
}

/**
 * Trigger a transactional event in Loops.
 * The eventName must match a transactional email trigger in the Loops dashboard.
 */
export async function triggerEvent(
  email: string,
  eventName: string,
  properties: Record<string, string | number | boolean> = {},
): Promise<{ ok: boolean }> {
  return loopsFetch('/events/send', {
    email,
    eventName,
    eventProperties: properties,
  });
}

/**
 * Add a tag to a contact. Creates the tag if it doesn't exist in Loops.
 */
export async function addTag(
  email: string,
  tag: string,
): Promise<{ ok: boolean }> {
  return loopsFetch('/contacts/update', {
    email,
    mailingLists: { [tag]: true },
  });
}

/**
 * Remove a tag from a contact.
 */
export async function removeTag(
  email: string,
  tag: string,
): Promise<{ ok: boolean }> {
  return loopsFetch('/contacts/update', {
    email,
    mailingLists: { [tag]: false },
  });
}
