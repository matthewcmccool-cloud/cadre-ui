'use client';

import { useState } from 'react';

// ── Data ─────────────────────────────────────────────────────────────

const PROBLEMS = [
  'Talent partners manually track hiring across portfolio companies',
  'Career page data is public but scattered across dozens of ATS platforms',
  'Static snapshots go stale within days',
  'No portfolio-level view exists — only company-by-company',
];

const VALUE_PROPS = [
  {
    title: 'Portfolio view',
    description:
      'Live job counts, department breakdowns, and side-by-side comparisons across every portfolio company.',
  },
  {
    title: 'Signals & alerts',
    description:
      'Automated notifications for hiring spikes, freezes, new departments, and velocity changes. Weekly digest.',
  },
  {
    title: 'Exports & storytelling',
    description:
      'One-click LinkedIn posts, CSV downloads, and PDF snapshots for board decks and LP reports.',
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

// ── Component ────────────────────────────────────────────────────────

export default function ForInvestorsContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    firm: '',
    portfolioSize: '',
    features: [] as string[],
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
      `Portfolio size: ${formData.portfolioSize}`,
      `Features: ${formData.features.join(', ') || 'None selected'}`,
    ].join('\n');

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
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="max-w-2xl mb-10">
        <p className="text-sm font-medium text-[#5e6ad2] mb-2 tracking-wide uppercase">
          The Portfolio Hiring Pulse
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
          Real-time hiring intelligence across your entire portfolio.
        </h1>
        <p className="text-base text-[#999] mb-5 leading-relaxed">
          Trends, comparisons, and alerts that replace manual tracking.
          Built for talent partners, platform teams, and GPs.
        </p>
        <span
          className="inline-block px-5 py-2 bg-[#252526] text-[#888] text-sm font-medium rounded-lg cursor-default"
        >
          Coming soon
        </span>
      </div>

      {/* ── The Problem ───────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">The problem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROBLEMS.map((problem) => (
            <div
              key={problem}
              className="flex gap-2.5 p-3 rounded-lg bg-[#131314] border border-[#1a1a1b]"
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

      {/* ── What You Get — 3 Value Props ───────────────────────── */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">What you get</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VALUE_PROPS.map((prop) => (
            <div
              key={prop.title}
              className="p-4 rounded-xl bg-[#131314] border border-[#1a1a1b]"
            >
              <h3 className="text-sm font-semibold text-white mb-1.5">
                {prop.title}
              </h3>
              <p className="text-xs text-[#888] leading-relaxed">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart: Where is hiring accelerating? ─────────────── */}
      <div className="mb-8">
        <div className="rounded-xl bg-[#131314] border border-[#1a1a1b] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-white mb-0.5">
            Where is hiring accelerating?
          </h3>
          <p className="text-xs text-[#666] mb-4">
            Portfolio-wide department breakdown — Engineering leads at 34% of all open roles.
          </p>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-[#0e0e0f] rounded-lg p-3 border border-[#1a1a1b]">
              <p className="text-xs text-[#666] mb-0.5">Open Roles</p>
              <p className="text-xl font-bold text-white">1,247</p>
              <p className="text-[11px] text-green-400 mt-0.5">+8.3% this week</p>
            </div>
            <div className="bg-[#0e0e0f] rounded-lg p-3 border border-[#1a1a1b]">
              <p className="text-xs text-[#666] mb-0.5">Hiring Velocity</p>
              <p className="text-xl font-bold text-white">62</p>
              <p className="text-[11px] text-[#888] mt-0.5">new roles / week</p>
            </div>
            <div className="bg-[#0e0e0f] rounded-lg p-3 border border-[#1a1a1b]">
              <p className="text-xs text-[#666] mb-0.5">Top Department</p>
              <p className="text-xl font-bold text-white">Eng</p>
              <p className="text-[11px] text-[#888] mt-0.5">34% of all roles</p>
            </div>
          </div>
          {/* Department bar chart */}
          <div className="space-y-1">
            {[
              { dept: 'Engineering', pct: 34, count: 424 },
              { dept: 'Sales & GTM', pct: 22, count: 274 },
              { dept: 'Product', pct: 12, count: 150 },
              { dept: 'Marketing', pct: 10, count: 125 },
              { dept: 'AI & Research', pct: 8, count: 100 },
              { dept: 'Design', pct: 5, count: 62 },
              { dept: 'Customer Success', pct: 4, count: 50 },
              { dept: 'People & Talent', pct: 3, count: 37 },
              { dept: 'Finance & Legal', pct: 1.5, count: 15 },
              { dept: 'Ops & Admin', pct: 0.5, count: 10 },
            ].map((row) => (
              <div key={row.dept} className="flex items-center gap-2.5">
                <span className="text-[11px] text-[#888] w-28 sm:w-32 truncate flex-shrink-0">{row.dept}</span>
                <div className="flex-1 h-3.5 bg-[#0e0e0f] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#5e6ad2]/40 rounded"
                    style={{ width: `${Math.max((row.pct / 34) * 90, 3)}%` }}
                  />
                </div>
                <span className="text-[11px] text-[#666] w-7 text-right flex-shrink-0">{row.count}</span>
              </div>
            ))}
          </div>
          {/* 4-week trend line */}
          <div className="mt-3 pt-3 border-t border-[#1a1a1b]">
            <p className="text-[11px] text-[#666] mb-1.5">Portfolio hiring trend (4 weeks)</p>
            <svg viewBox="0 0 400 60" className="w-full h-12" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#5e6ad2" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="15" x2="400" y2="15" stroke="#1a1a1b" strokeWidth="1" />
              <line x1="0" y1="30" x2="400" y2="30" stroke="#1a1a1b" strokeWidth="1" />
              <line x1="0" y1="45" x2="400" y2="45" stroke="#1a1a1b" strokeWidth="1" />
              <path d="M0,42 L57,38 L114,32 L171,34 L228,26 L285,21 L342,17 L400,14 L400,60 L0,60 Z" fill="url(#trendFill)" />
              <path d="M0,42 L57,38 L114,32 L171,34 L228,26 L285,21 L342,17 L400,14" fill="none" stroke="#5e6ad2" strokeWidth="2" />
              <circle cx="0" cy="42" r="2.5" fill="#5e6ad2" />
              <circle cx="114" cy="32" r="2.5" fill="#5e6ad2" />
              <circle cx="228" cy="26" r="2.5" fill="#5e6ad2" />
              <circle cx="400" cy="14" r="2.5" fill="#5e6ad2" />
            </svg>
            <div className="flex justify-between text-[11px] text-[#555] mt-0.5">
              <span>Jan 13</span>
              <span>Jan 20</span>
              <span>Jan 27</span>
              <span>Feb 3</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chart: How do portfolio companies compare? ─────────── */}
      <div className="mb-10">
        <div className="rounded-xl bg-[#131314] border border-[#1a1a1b] overflow-hidden">
          <div className="p-4 sm:p-5 pb-0 sm:pb-0">
            <h3 className="text-sm font-semibold text-white mb-0.5">
              How do portfolio companies compare?
            </h3>
            <p className="text-xs text-[#666] mb-3">
              Beacon Labs grew headcount 31% in 4 weeks — the fastest in this cohort.
            </p>
          </div>
          {/* Header row */}
          <div className="grid grid-cols-4 gap-0 border-b border-[#1a1a1b]">
            <div className="px-4 py-2 text-xs text-[#555]" />
            <div className="px-3 py-2 text-center border-l border-[#1a1a1b]">
              <p className="text-sm font-medium text-white">Acme AI</p>
              <p className="text-[11px] text-[#666]">Series B</p>
            </div>
            <div className="px-3 py-2 text-center border-l border-[#1a1a1b]">
              <p className="text-sm font-medium text-white">Beacon Labs</p>
              <p className="text-[11px] text-[#666]">Series A</p>
            </div>
            <div className="px-3 py-2 text-center border-l border-[#1a1a1b]">
              <p className="text-sm font-medium text-white">Cortex</p>
              <p className="text-[11px] text-[#666]">Series C</p>
            </div>
          </div>
          {/* Data rows */}
          {[
            { label: 'Open roles', values: ['48', '22', '85'] },
            { label: 'Top department', values: ['Engineering', 'Sales & GTM', 'Engineering'] },
            { label: '4-week change', values: ['+12%', '+31%', '-4%'], colors: ['text-green-400', 'text-green-400', 'text-red-400'] },
            { label: 'Eng % of hiring', values: ['42%', '18%', '38%'] },
            { label: 'Hiring velocity', values: ['6/wk', '4/wk', '9/wk'] },
          ].map((row, i) => (
            <div key={row.label} className={`grid grid-cols-4 gap-0 ${i !== 4 ? 'border-b border-[#1a1a1b]' : ''}`}>
              <div className="px-4 py-2 text-xs text-[#888]">{row.label}</div>
              {row.values.map((val, j) => (
                <div key={j} className="px-3 py-2 text-center text-sm border-l border-[#1a1a1b]">
                  <span className={row.colors ? row.colors[j] : 'text-[#e8e8e8]'}>{val}</span>
                </div>
              ))}
            </div>
          ))}
          {/* Mini trend overlay */}
          <div className="border-t border-[#1a1a1b] p-3">
            <p className="text-[11px] text-[#555] mb-1.5">Hiring trend overlay</p>
            <svg viewBox="0 0 400 50" className="w-full h-10" preserveAspectRatio="none">
              <line x1="0" y1="12" x2="400" y2="12" stroke="#1a1a1b" strokeWidth="1" />
              <line x1="0" y1="25" x2="400" y2="25" stroke="#1a1a1b" strokeWidth="1" />
              <line x1="0" y1="38" x2="400" y2="38" stroke="#1a1a1b" strokeWidth="1" />
              <path d="M0,33 L67,31 L133,26 L200,25 L267,20 L333,18 L400,16" fill="none" stroke="#5e6ad2" strokeWidth="2" />
              <path d="M0,42 L67,40 L133,35 L200,31 L267,24 L333,21 L400,18" fill="none" stroke="#4ade80" strokeWidth="2" />
              <path d="M0,12 L67,13 L133,15 L200,16 L267,18 L333,20 L400,19" fill="none" stroke="#f59e0b" strokeWidth="2" />
            </svg>
            <div className="flex gap-4 mt-1.5">
              <span className="flex items-center gap-1.5 text-[11px] text-[#888]">
                <span className="w-3 h-0.5 bg-[#5e6ad2] rounded-full inline-block" />
                Acme AI
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#888]">
                <span className="w-3 h-0.5 bg-[#4ade80] rounded-full inline-block" />
                Beacon Labs
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#888]">
                <span className="w-3 h-0.5 bg-[#f59e0b] rounded-full inline-block" />
                Cortex
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 10 Analytics Segments — Multi-Column Grid ──────────── */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-1.5">
          10 analytics segments
        </h2>
        <p className="text-sm text-[#666] mb-3">
          Hiring data organized into departments that map to how VCs think about teams.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SEGMENTS.map((seg) => (
            <div
              key={seg.name}
              className="px-3 py-2.5 rounded-lg bg-[#131314] border border-[#1a1a1b]"
            >
              <p className="text-xs font-medium text-[#e8e8e8] leading-tight">{seg.name}</p>
              <p className="text-[11px] text-[#666] mt-0.5">{seg.signal}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Why Cadre ─────────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-3">Why Cadre</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {WHY_CADRE.map((item) => (
            <div key={item.label} className="flex gap-2.5">
              <span className="text-green-400/60 mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-white leading-tight">{item.label}</p>
                <p className="text-xs text-[#888]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Request Early Access ───────────────────────────────── */}
      <div
        id="request-access"
        className="rounded-xl bg-[#131314] border border-[#1a1a1b] p-5 scroll-mt-8"
      >
        <h2 className="text-lg font-semibold text-white mb-1">
          Request early access
        </h2>
        <p className="text-sm text-[#666] mb-4">
          We&apos;re onboarding a small group of VC firms. No commitment — just tell
          us what you&apos;d use.
        </p>

        {submitted ? (
          <div className="py-6 text-center">
            <p className="text-green-400 font-medium mb-1">Thanks for your interest!</p>
            <p className="text-sm text-[#888]">
              We&apos;ll be in touch shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="px-3 py-2 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
              <input
                type="email"
                required
                placeholder="Work email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className="px-3 py-2 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="VC firm name"
                value={formData.firm}
                onChange={(e) => setFormData((p) => ({ ...p, firm: e.target.value }))}
                className="px-3 py-2 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
              <input
                type="text"
                placeholder="Approximate portfolio size"
                value={formData.portfolioSize}
                onChange={(e) => setFormData((p) => ({ ...p, portfolioSize: e.target.value }))}
                className="px-3 py-2 bg-[#0e0e0f] border border-[#252526] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#5e6ad2]/50"
              />
            </div>
            <div>
              <p className="text-xs text-[#888] mb-2">
                Which features matter most to you?
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FEATURE_OPTIONS.map((opt) => {
                  const selected = formData.features.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleFeature(opt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-[#5e6ad2] hover:bg-[#4f5bc3] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Submitting...' : 'Request access'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
