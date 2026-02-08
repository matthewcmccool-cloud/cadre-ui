'use client';

import { useState } from 'react';

// ── Data ─────────────────────────────────────────────────────────────

const PROBLEMS = [
  'Talent partners manually track hiring across portfolio companies',
  'Career page data is public but scattered across dozens of ATS platforms',
  'Static snapshots go stale within days',
  'No portfolio-level view exists — only company-by-company',
];

const FEATURES = [
  {
    title: 'Portfolio Company Listing',
    description:
      'Full roster with live job counts, top department, and 4-week trend per company.',
  },
  {
    title: 'Portfolio-Wide Insights',
    description:
      'Aggregate hiring by department across the portfolio. Summary cards, segment breakdowns, trend lines, and hiring velocity.',
  },
  {
    title: 'Company Comparisons',
    description:
      'Side-by-side comparison of up to 5 companies. Segment breakdown, trend overlay — any company in the Cadre database.',
  },
  {
    title: 'Alerts',
    description:
      'Automated notifications for hiring spikes, freezes, new department activity, and milestones. Weekly email digest.',
  },
  {
    title: 'LinkedIn Export',
    description:
      'One-click generation of a pre-formatted LinkedIn post featuring portfolio jobs grouped by department.',
  },
  {
    title: 'Raw Exports',
    description:
      'CSV and PDF downloads for board decks and LP reports. Portfolio overview, trend data, comparison views, and full job listings.',
  },
];

const SEGMENTS = [
  { name: 'Sales & GTM', signal: 'Revenue scaling' },
  { name: 'Marketing', signal: 'Distribution investment' },
  { name: 'Engineering', signal: 'Core builder headcount' },
  { name: 'AI & Research', signal: 'R&D investment' },
  { name: 'Product', signal: 'Build vs maintain' },
  { name: 'Design', signal: 'Maturity signal' },
  { name: 'Customer Success & Support', signal: 'Retention investment' },
  { name: 'People & Talent', signal: 'Scaling signal' },
  { name: 'Finance & Legal', signal: 'Operational maturity' },
  { name: 'Operations & Admin', signal: 'Overhead functions' },
];

const WHY_CADRE = [
  { label: 'Automated', text: 'ATS connectors (Greenhouse, Lever, Ashby) sync daily' },
  { label: 'Live', text: 'Data refreshes continuously, not quarterly snapshots' },
  { label: 'Broad', text: '1,300+ companies, 200+ investors, 16,000+ jobs tracked' },
  { label: 'Longitudinal', text: 'Weekly snapshots build a time-series data moat no competitor can replicate retroactively' },
];

const FEATURE_OPTIONS = [
  'Portfolio hiring dashboard',
  'Company comparisons',
  'Weekly alerts',
  'LinkedIn export',
  'Raw data exports',
];

const COMPETITORS = [
  { name: 'Getro', gap: 'Expensive, limited analytics, siloed portals with no organic traffic' },
  { name: 'Pallet', gap: 'Community job boards, not VC-focused' },
  { name: 'Harmonic', gap: 'Company/people data for sourcing, not portfolio-oriented' },
  { name: 'Manual LinkedIn posts', gap: 'Labor-intensive, stale within days' },
];

// ── Component ────────────────────────────────────────────────────────

export default function ForInvestorsContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    firm: '',
    role: '',
    portfolioSize: '',
    features: [] as string[],
    other: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const body = [
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Firm: ${formData.firm}`,
      `Role: ${formData.role}`,
      `Portfolio size: ${formData.portfolioSize}`,
      `Features: ${formData.features.join(', ') || 'None selected'}`,
      formData.other ? `Other: ${formData.other}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    window.open(
      `mailto:matt@cadre.work?subject=${encodeURIComponent(
        `Cadre Early Access — ${formData.firm}`
      )}&body=${encodeURIComponent(body)}`,
      '_self'
    );

    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-12 pb-20">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="max-w-2xl mb-20">
        <p className="text-sm font-medium text-[#5e6ad2] mb-3 tracking-wide uppercase">
          The Portfolio Hiring Pulse
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
          Real-time hiring intelligence across your entire portfolio.
        </h1>
        <p className="text-lg text-[#999] mb-8 leading-relaxed">
          Trends, comparisons, and alerts that replace manual tracking.
          Built for talent partners, platform teams, and GPs.
        </p>
        <a
          href="#request-access"
          className="inline-block px-5 py-2.5 bg-[#5e6ad2] hover:bg-[#4f5bc3] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Request early access
        </a>
      </div>

      {/* ── The Problem ───────────────────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-lg font-semibold text-white mb-6">The problem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROBLEMS.map((problem) => (
            <div
              key={problem}
              className="flex gap-3 p-4 rounded-lg bg-[#131314] border border-[#1a1a1b]"
            >
              <span className="text-red-400/60 mt-0.5 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <p className="text-sm text-[#999]">{problem}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── What You Get ──────────────────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-lg font-semibold text-white mb-2">What you get</h2>
        <p className="text-sm text-[#666] mb-8">Six tools built on one unified dataset.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="p-5 rounded-xl bg-[#131314] border border-[#1a1a1b]"
            >
              <span className="text-xs text-[#5e6ad2] font-medium">{i + 1}</span>
              <h3 className="text-sm font-semibold text-white mt-2 mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs text-[#888] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 10 Analytics Segments ─────────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-lg font-semibold text-white mb-2">
          10 analytics segments
        </h2>
        <p className="text-sm text-[#666] mb-6">
          All hiring data organized into departments that map to how VCs think about teams.
        </p>
        <div className="rounded-xl bg-[#131314] border border-[#1a1a1b] overflow-hidden">
          {SEGMENTS.map((seg, i) => (
            <div
              key={seg.name}
              className={`flex items-center justify-between px-5 py-3 text-sm ${
                i !== SEGMENTS.length - 1 ? 'border-b border-[#1a1a1b]' : ''
              }`}
            >
              <span className="text-[#e8e8e8] font-medium">{seg.name}</span>
              <span className="text-[#666]">{seg.signal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Why Cadre ─────────────────────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-lg font-semibold text-white mb-6">Why Cadre</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHY_CADRE.map((item) => (
            <div key={item.label} className="flex gap-3">
              <span className="text-green-400/60 mt-1 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-[#888]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── vs. Alternatives ──────────────────────────────────── */}
      <div className="mb-20">
        <h2 className="text-lg font-semibold text-white mb-6">
          vs. the alternatives
        </h2>
        <div className="rounded-xl bg-[#131314] border border-[#1a1a1b] overflow-hidden">
          {COMPETITORS.map((comp, i) => (
            <div
              key={comp.name}
              className={`flex items-start gap-4 px-5 py-3.5 text-sm ${
                i !== COMPETITORS.length - 1 ? 'border-b border-[#1a1a1b]' : ''
              }`}
            >
              <span className="text-[#e8e8e8] font-medium w-40 flex-shrink-0">
                {comp.name}
              </span>
              <span className="text-[#666]">{comp.gap}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#555] mt-3">
          Cadre&apos;s edge: one destination for all VC-backed jobs with investor-specific
          analytics layered on top. VCs don&apos;t get a dead-end portal — they get a window
          into a platform that already has traffic.
        </p>
      </div>

      {/* ── Interest Form ─────────────────────────────────────── */}
      <div
        id="request-access"
        className="rounded-xl bg-[#131314] border border-[#1a1a1b] p-6 sm:p-8 max-w-xl scroll-mt-8"
      >
        <h2 className="text-lg font-semibold text-white mb-1">
          Request early access
        </h2>
        <p className="text-sm text-[#666] mb-6">
          We&apos;re onboarding a small group of VC firms. No commitment — just tell
          us what you&apos;d use.
        </p>

        {submitted ? (
          <div className="py-8 text-center">
            <p className="text-green-400 font-medium mb-1">Thanks for your interest!</p>
            <p className="text-sm text-[#888]">
              We&apos;ll be in touch shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="px-3 py-2.5 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
              <input
                type="email"
                required
                placeholder="Work email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className="px-3 py-2.5 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="VC firm name"
                value={formData.firm}
                onChange={(e) => setFormData((p) => ({ ...p, firm: e.target.value }))}
                className="px-3 py-2.5 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
              <input
                type="text"
                placeholder="Role / title"
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                className="px-3 py-2.5 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
            </div>
            <input
              type="text"
              placeholder="Approximate portfolio size (number of companies)"
              value={formData.portfolioSize}
              onChange={(e) => setFormData((p) => ({ ...p, portfolioSize: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
            />

            <div>
              <p className="text-xs text-[#888] mb-2.5">
                Which features matter most to you?
              </p>
              <div className="flex flex-wrap gap-2">
                {FEATURE_OPTIONS.map((opt) => {
                  const selected = formData.features.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleFeature(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selected
                          ? 'bg-[#5e6ad2]/20 text-[#5e6ad2] border border-[#5e6ad2]/40'
                          : 'bg-[#0e0e0f] text-[#888] border border-[#252526] hover:border-[#444]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea
              placeholder="Anything else you'd want to see? (optional)"
              value={formData.other}
              onChange={(e) => setFormData((p) => ({ ...p, other: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50 resize-none"
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#5e6ad2] hover:bg-[#4f5bc3] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Submitting...' : 'Request access'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
