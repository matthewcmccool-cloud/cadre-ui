/**
 * Shared number formatting utilities.
 */

/** Format a number with commas: 1786 → "1,786". Returns "0" for null/undefined. */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '0';
  return n.toLocaleString('en-US');
}

/**
 * Format a numeric dollar amount into a compact currency string.
 *
 *   1_000_000_000+  → "$1B", "$63.9B"
 *   1_000_000+      → "$1M", "$500M", "$12.5M"
 *   1_000+          → "$1K", "$750K"
 *   Under 1000      → "$500"
 *   null/undefined  → "Undisclosed"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || amount <= 0) return 'Undisclosed';

  if (amount >= 1_000_000_000) {
    const b = amount / 1_000_000_000;
    return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '')}K`;
  }

  return `$${amount.toLocaleString('en-US')}`;
}

/**
 * Format a fundraise amount string into a compact form.
 *
 * Handles raw numbers (from Airtable "Total Raised" field) and
 * already-formatted strings:
 *   "63920000000"  → "$63.9B"
 *   "500000000"    → "$500M"
 *   "12500000"     → "$12.5M"
 *   "750000"       → "$750K"
 *   "$50M"         → "$50M"  (pass-through)
 *   undefined      → undefined
 */
export function formatAmount(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  // If already formatted (starts with $ and ends with letter), pass through
  if (/^\$[\d.,]+[BKMGT]$/i.test(raw.trim())) {
    return raw.trim();
  }

  // Try to parse as a number
  const cleaned = raw.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return raw; // Return original if not parseable

  if (num >= 1_000_000_000) {
    const b = num / 1_000_000_000;
    return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '')}K`;
  }

  return `$${num.toLocaleString('en-US')}`;
}
