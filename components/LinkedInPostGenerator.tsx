'use client';

import { useState } from 'react';

interface CompanySummary {
  name: string;
  slug: string;
  roleCount: number;
  url: string;
  remoteCount: number;
  topFunctions: string[];
}

interface PostResult {
  investor: string;
  totalRoles: number;
  totalCompanies: number;
  filter: string;
  post: string;
  companies: CompanySummary[];
  generatedAt: string;
}

const FILTER_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'remote', label: 'Remote Only' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'design', label: 'Design' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'ai', label: 'AI & Research' },
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function LinkedInPostGenerator({ investors }: { investors: string[] }) {
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(30);
  const [result, setResult] = useState<PostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!selectedInvestor) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const slug = toSlug(selectedInvestor);
      const params = new URLSearchParams({ investor: slug });
      if (filter) params.set('filter', filter);
      if (limit !== 30) params.set('limit', String(limit));

      const res = await fetch(`/api/content/linkedin-post?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to generate post');
        return;
      }

      setResult(data);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.post) return;
    await navigator.clipboard.writeText(result.post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-[#1a1a1b] rounded-lg p-4 space-y-4">
        {/* Investor select */}
        <div>
          <label className="block text-xs text-[#888] mb-1.5">Investor / VC Firm</label>
          <select
            value={selectedInvestor}
            onChange={(e) => setSelectedInvestor(e.target.value)}
            className="w-full bg-[#0e0e0f] text-[#e8e8e8] border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50"
          >
            <option value="">Select an investor...</option>
            {investors.map((inv) => (
              <option key={inv} value={inv}>{inv}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          {/* Filter */}
          <div className="flex-1">
            <label className="block text-xs text-[#888] mb-1.5">Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-[#0e0e0f] text-[#e8e8e8] border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Limit */}
          <div className="w-28">
            <label className="block text-xs text-[#888] mb-1.5">Max companies</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10) || 30)}
              min={5}
              max={100}
              className="w-full bg-[#0e0e0f] text-[#e8e8e8] border border-[#333] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5e6ad2]/50"
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!selectedInvestor || loading}
          className="w-full py-2.5 bg-[#5e6ad2] hover:bg-[#6e7ae2] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Post'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center gap-4 text-xs text-[#888]">
            <span>
              <span className="text-[#e8e8e8] font-medium">{result.totalCompanies}</span> companies
            </span>
            <span className="text-[#333]">·</span>
            <span>
              <span className="text-[#e8e8e8] font-medium">{result.totalRoles.toLocaleString()}</span> open roles
            </span>
            <span className="text-[#333]">·</span>
            <span>{result.investor}</span>
          </div>

          {/* Post preview */}
          <div className="bg-[#1a1a1b] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#252526]">
              <span className="text-xs text-[#888]">LinkedIn Post Preview</span>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-[#5e6ad2] hover:bg-[#6e7ae2] text-white text-xs font-medium rounded transition-colors"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="p-4 text-sm text-[#e8e8e8] whitespace-pre-wrap font-sans leading-relaxed overflow-x-auto">
              {result.post}
            </pre>
          </div>

          {/* Company breakdown table */}
          <div className="bg-[#1a1a1b] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#252526]">
              <span className="text-xs text-[#888]">Company Breakdown</span>
            </div>
            <div className="divide-y divide-[#252526]">
              {result.companies.map((company) => (
                <div key={company.slug} className="flex items-center justify-between px-4 py-2">
                  <div>
                    <span className="text-sm text-[#e8e8e8]">{company.name}</span>
                    {company.topFunctions.length > 0 && (
                      <span className="text-xs text-[#888] ml-2">
                        {company.topFunctions.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {company.remoteCount > 0 && (
                      <span className="text-[10px] text-green-400/70 px-1.5 py-0.5 bg-green-400/10 rounded">
                        {company.remoteCount} remote
                      </span>
                    )}
                    <span className="text-xs text-[#e8e8e8] font-medium w-16 text-right">
                      {company.roleCount} {company.roleCount === 1 ? 'role' : 'roles'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
