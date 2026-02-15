'use client';

import { useState, useRef } from 'react';

const pages = ['intro', 'getting-started', 'jobs', 'companies', 'investors', 'signals', 'batch', 'examples', 'integrations', 'access'] as const;
type PageId = typeof pages[number];

export default function DocsPage() {
  const [activePage, setActivePage] = useState<PageId>('intro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  function navTo(id: PageId) {
    setActivePage(id);
    setMobileMenuOpen(false);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }

  function copyCode(btn: HTMLButtonElement) {
    const pre = btn.closest('.cb')?.querySelector('pre');
    if (!pre) return;
    navigator.clipboard.writeText(pre.innerText).then(() => {
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 1500);
    });
  }

  return (
    <>
      <style>{`
        @font-face {
          font-family: 'Geist Mono';
          src: url('https://cdn.jsdelivr.net/gh/nicro950/geist-mono@main/fonts/GeistMono-Regular.woff2') format('woff2');
          font-weight: 400;
        }
        @font-face {
          font-family: 'Geist Mono';
          src: url('https://cdn.jsdelivr.net/gh/nicro950/geist-mono@main/fonts/GeistMono-Medium.woff2') format('woff2');
          font-weight: 500;
        }
        @font-face {
          font-family: 'Geist Mono';
          src: url('https://cdn.jsdelivr.net/gh/nicro950/geist-mono@main/fonts/GeistMono-SemiBold.woff2') format('woff2');
          font-weight: 600;
        }
        @font-face {
          font-family: 'Geist Mono';
          src: url('https://cdn.jsdelivr.net/gh/nicro950/geist-mono@main/fonts/GeistMono-Bold.woff2') format('woff2');
          font-weight: 700;
        }
        :root {
          --bg: #000;
          --bg-code: #080808;
          --border: #1a1a1a;
          --border-light: #111;
          --text: #888;
          --text-bright: #bbb;
          --text-dim: #444;
          --text-xdim: #2a2a2a;
          --copied: #666;
          --mono: 'Geist Mono', 'JetBrains Mono', monospace;
        }
        header, footer, nav.fixed, nav.sticky { display: none !important; }
        body {
          background: var(--bg) !important;
          color: var(--text) !important;
          font-family: var(--mono) !important;
          font-size: 13px !important;
          line-height: 1.7 !important;
          -webkit-font-smoothing: antialiased !important;
          overflow: hidden !important;
          height: 100vh !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        ::selection { background: rgba(255,255,255,0.08); }
        .docs-app {
          display: grid;
          grid-template-columns: 216px 1fr;
          height: 100vh;
        }
        /* ── Sidebar ── */
        .sidebar {
          border-right: 1px solid var(--border);
          padding: 36px 0;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #111 transparent;
        }
        .sb-brand {
          padding: 0 22px 28px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 20px;
        }
        .sb-brand .mark {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-bright);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .sb-brand .mark-dot { color: var(--text-dim); }
        .sb-brand .sub {
          display: block;
          font-size: 11px;
          color: var(--text-dim);
          margin-top: 6px;
        }
        .nav-group {
          padding: 0 12px;
          margin-bottom: 20px;
        }
        .nav-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 6px;
        }
        .nav-item {
          display: block;
          padding: 5px 8px;
          font-size: 12px;
          color: var(--text-dim);
          cursor: pointer;
          transition: color 0.1s;
          user-select: none;
          border-radius: 3px;
        }
        .nav-item:hover { color: var(--text); }
        .nav-item.active { color: var(--text-bright); background: rgba(255,255,255,0.02); }
        .sb-footer {
          margin-top: auto;
          padding: 16px 22px 0;
          border-top: 1px solid var(--border);
        }
        .sb-footer a {
          font-size: 12px;
          color: var(--text-dim);
          text-decoration: none;
        }
        .sb-footer a:hover { color: var(--text-bright); }
        /* ── Content ── */
        .docs-content {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #1a1a1a transparent;
        }
        .pg {
          display: none;
          max-width: 660px;
          padding: 48px 56px 100px;
        }
        .pg.active { display: block; }
        /* ── Type ── */
        .pg h1 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-bright);
          margin-bottom: 24px;
          letter-spacing: 0.02em;
        }
        .pg h2 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-bright);
          margin-top: 40px;
          margin-bottom: 12px;
        }
        .pg p {
          margin-bottom: 16px;
          line-height: 1.75;
        }
        .pg p:last-child { margin-bottom: 0; }
        .b { color: var(--text-bright); }
        .d { color: var(--text-dim); }
        .pg hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 36px 0;
        }
        /* ── Endpoint Badge ── */
        .ep {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          margin-top: 36px;
        }
        .ep:first-of-type { margin-top: 0; }
        .ep-method {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-bright);
          background: rgba(255,255,255,0.04);
          padding: 2px 7px;
          border-radius: 2px;
          letter-spacing: 0.03em;
        }
        .ep-path {
          font-size: 12px;
          color: var(--text);
        }
        /* ── Code ── */
        .cb {
          background: var(--bg-code);
          border: 1px solid var(--border);
          margin: 12px 0 20px;
          overflow: hidden;
          position: relative;
        }
        .cb-head {
          padding: 6px 14px;
          border-bottom: 1px solid var(--border-light);
          font-size: 11px;
          color: var(--text-dim);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cb-copy {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--text-dim);
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 2px;
          transition: all 0.12s;
        }
        .cb-copy:hover { color: var(--text); background: rgba(255,255,255,0.04); }
        .cb-copy.copied { color: var(--copied); }
        .cb-body {
          padding: 14px 16px;
          overflow-x: auto;
        }
        .cb-body pre {
          font-family: var(--mono);
          font-size: 12px;
          line-height: 1.75;
          color: var(--text-dim);
          margin: 0;
          white-space: pre;
          background: none;
          border: none;
          padding: 0;
          border-radius: 0;
        }
        .cv { color: var(--text); }
        .ck { color: var(--text-xdim); }
        /* ── Params ── */
        .params { margin: 12px 0 20px; }
        .pr {
          padding: 7px 0;
          border-bottom: 1px solid var(--border-light);
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 12px;
          font-size: 12px;
        }
        .pr:last-child { border-bottom: none; }
        .pr .n { color: var(--text-bright); }
        .pr .i { color: var(--text-dim); }
        /* ── Query blocks ── */
        .qb {
          padding: 16px 0;
          border-bottom: 1px solid var(--border-light);
        }
        .qb:last-child { border-bottom: none; }
        .qb-q {
          font-size: 12px;
          color: var(--text-bright);
          line-height: 1.6;
          margin-bottom: 6px;
        }
        .qb-w {
          font-size: 11px;
          color: var(--text-dim);
          line-height: 1.5;
        }
        /* ── Footer ── */
        .foot {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        .foot p { font-size: 12px; margin-bottom: 10px; }
        .foot-link {
          font-size: 12px;
          color: var(--text-bright);
          border-bottom: 1px solid var(--text-dim);
          padding-bottom: 1px;
          text-decoration: none;
        }
        .foot-link:hover { color: #fff; border-color: #fff; text-decoration: none; }
        /* ── Next link ── */
        .next-link {
          display: inline-block;
          margin-top: 32px;
          font-size: 12px;
          color: var(--text-dim);
          cursor: pointer;
          transition: color 0.1s;
        }
        .next-link:hover { color: var(--text-bright); text-decoration: none; }
        /* ── Mobile Nav ── */
        .mob-header {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: 48px;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
        }
        .mob-brand {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-bright);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .mob-brand .mob-dot { color: var(--text-dim); }
        .mob-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 22px;
        }
        .mob-toggle span {
          display: block;
          height: 1.5px;
          background: var(--text-dim);
          transition: all 0.2s;
          width: 100%;
        }
        .mob-toggle.open span:nth-child(1) {
          transform: rotate(45deg) translate(3.5px, 3.5px);
        }
        .mob-toggle.open span:nth-child(2) {
          opacity: 0;
        }
        .mob-toggle.open span:nth-child(3) {
          transform: rotate(-45deg) translate(3.5px, -3.5px);
        }
        .mob-menu {
          display: none;
          position: fixed;
          top: 48px;
          left: 0; right: 0; bottom: 0;
          z-index: 99;
          background: var(--bg);
          overflow-y: auto;
          padding: 20px 18px 40px;
        }
        .mob-menu.open { display: block; }
        .mob-menu .nav-label {
          padding: 0;
          margin-top: 20px;
        }
        .mob-menu .nav-label:first-child { margin-top: 0; }
        .mob-menu .nav-item {
          padding: 10px 0;
          font-size: 13px;
          border-bottom: 1px solid var(--border-light);
        }
        .mob-menu .nav-item:last-child { border-bottom: none; }
        /* ── Responsive ── */
        @media (max-width: 700px) {
          .docs-app { grid-template-columns: 1fr; padding-top: 48px; }
          .sidebar { display: none; }
          .mob-header { display: flex; }
          body { overflow: auto !important; }
          .pg { padding: 28px 18px 60px; }
          .pr { grid-template-columns: 120px 1fr; }
        }
      `}</style>

      {/* ─── Mobile Header ─── */}
      <div className="mob-header">
        <span className="mob-brand">CADRE<span className="mob-dot"> &middot;</span></span>
        <button
          className={`mob-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
      </div>
      <div className={`mob-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-label">Overview</div>
        <div className={`nav-item ${activePage === 'intro' ? 'active' : ''}`} onClick={() => navTo('intro')}>Introduction</div>
        <div className={`nav-item ${activePage === 'getting-started' ? 'active' : ''}`} onClick={() => navTo('getting-started')}>Getting Started</div>
        <div className="nav-label">Endpoints</div>
        <div className={`nav-item ${activePage === 'jobs' ? 'active' : ''}`} onClick={() => navTo('jobs')}>Jobs</div>
        <div className={`nav-item ${activePage === 'companies' ? 'active' : ''}`} onClick={() => navTo('companies')}>Companies</div>
        <div className={`nav-item ${activePage === 'investors' ? 'active' : ''}`} onClick={() => navTo('investors')}>Investors</div>
        <div className={`nav-item ${activePage === 'signals' ? 'active' : ''}`} onClick={() => navTo('signals')}>Signals</div>
        <div className={`nav-item ${activePage === 'batch' ? 'active' : ''}`} onClick={() => navTo('batch')}>Batch</div>
        <div className="nav-label">Guides</div>
        <div className={`nav-item ${activePage === 'examples' ? 'active' : ''}`} onClick={() => navTo('examples')}>Example Queries</div>
        <div className={`nav-item ${activePage === 'integrations' ? 'active' : ''}`} onClick={() => navTo('integrations')}>Integrations</div>
        <div className="nav-label" style={{ marginTop: 24 }}></div>
        <div className={`nav-item ${activePage === 'access' ? 'active' : ''}`} onClick={() => navTo('access')}>Request Access</div>
      </div>

      <div className="docs-app">
        <nav className="sidebar">
          <div className="sb-brand">
            <span className="mark">CADRE<span className="mark-dot"> &middot;</span></span>
            <span className="sub">API Docs</span>
          </div>
          <div className="nav-group">
            <div className="nav-label">Overview</div>
            <div className={`nav-item ${activePage === 'intro' ? 'active' : ''}`} onClick={() => navTo('intro')}>Introduction</div>
            <div className={`nav-item ${activePage === 'getting-started' ? 'active' : ''}`} onClick={() => navTo('getting-started')}>Getting Started</div>
          </div>
          <div className="nav-group">
            <div className="nav-label">Endpoints</div>
            <div className={`nav-item ${activePage === 'jobs' ? 'active' : ''}`} onClick={() => navTo('jobs')}>Jobs</div>
            <div className={`nav-item ${activePage === 'companies' ? 'active' : ''}`} onClick={() => navTo('companies')}>Companies</div>
            <div className={`nav-item ${activePage === 'investors' ? 'active' : ''}`} onClick={() => navTo('investors')}>Investors</div>
            <div className={`nav-item ${activePage === 'signals' ? 'active' : ''}`} onClick={() => navTo('signals')}>Signals</div>
            <div className={`nav-item ${activePage === 'batch' ? 'active' : ''}`} onClick={() => navTo('batch')}>Batch</div>
          </div>
          <div className="nav-group">
            <div className="nav-label">Guides</div>
            <div className={`nav-item ${activePage === 'examples' ? 'active' : ''}`} onClick={() => navTo('examples')}>Example Queries</div>
            <div className={`nav-item ${activePage === 'integrations' ? 'active' : ''}`} onClick={() => navTo('integrations')}>Integrations</div>
          </div>
          <div className="nav-group">
            <div className={`nav-item ${activePage === 'access' ? 'active' : ''}`} onClick={() => navTo('access')}>Request Access</div>
          </div>
          <div className="sb-footer">
            <a href="https://YOUR_LOOPS_FORM_URL" target="_blank" rel="noopener noreferrer">Contact &rarr;</a>
          </div>
        </nav>

        <div className="docs-content" ref={contentRef}>
          {/* ─── Introduction ─── */}
          <div className={`pg ${activePage === 'intro' ? 'active' : ''}`} id="intro">
            <h1>Introduction</h1>
            <p>
              CADRE is a hiring intelligence API for AI agents. It provides structured, real-time access to job postings, company profiles, investor portfolios, and hiring signals across the VC-backed ecosystem — connected in a single knowledge graph.
            </p>
            <p>
              The API is designed for AI recruiting tools that need to reason across multiple data dimensions in a single call — sourcing agents, career copilots, talent marketplaces, and hiring analytics platforms.
            </p>
            <hr />
            <h2 style={{ marginTop: 0 }}>What&apos;s in the graph</h2>
            <p>
              <span className="b">Jobs</span> — title, function, seniority, location, remote policy, posting date, application URL, data freshness.
            </p>
            <p>
              <span className="b">Companies</span> — funding stage, headcount, ATS platform, headquarters, total raised, hiring velocity, open role counts.
            </p>
            <p>
              <span className="b">Investors</span> — portfolio companies, aggregate hiring data, sector focus, co-investment patterns.
            </p>
            <p>
              <span className="b">Industries</span> — sector taxonomy with hiring trends, function breakdowns, velocity benchmarks.
            </p>
            <p>
              <span className="b">Time</span> — historical posting data, velocity deltas, pattern detection across all dimensions.
            </p>
            <p style={{ marginTop: 24 }}>
              Every record is graph-connected. A job response includes its parent company, that company&apos;s investors, and industry context. Your agent can traverse from any node to any other without additional calls.
            </p>
            <hr />
            <h2 style={{ marginTop: 0 }}>Response format</h2>
            <p>All endpoints return a consistent envelope:</p>
            <div className="cb">
              <div className="cb-head">Envelope</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;data&quot;</span>{`: [ ... ],       `}<span className="ck">// array of objects</span>{`
  `}<span className="cv">&quot;meta&quot;</span>{`: {
    `}<span className="cv">&quot;total&quot;</span>{`: 847,        `}<span className="ck">// total matching records</span>{`
    `}<span className="cv">&quot;has_more&quot;</span>{`: true,    `}<span className="ck">// more pages available</span>{`
    `}<span className="cv">&quot;cursor&quot;</span>{`: "..."      `}<span className="ck">// pass to next request</span>{`
  }
}`}</pre>
              </div>
            </div>
            <p>
              Every record includes a <span className="b">freshness</span> field indicating how recently the data was verified against its source — e.g. <span className="b">&quot;4h&quot;</span>, <span className="b">&quot;1d&quot;</span>, <span className="b">&quot;7d&quot;</span>. Use this to assess data reliability in your agent&apos;s reasoning.
            </p>
            <span className="next-link" onClick={() => navTo('getting-started')}>Getting Started &rarr;</span>
          </div>

          {/* ─── Getting Started ─── */}
          <div className={`pg ${activePage === 'getting-started' ? 'active' : ''}`} id="getting-started">
            <h1>Getting Started</h1>
            <h2 style={{ marginTop: 0 }}>Base URL</h2>
            <div className="cb">
              <div className="cb-head"><span></span><button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>https://api.cadre.careers/v1</pre>
              </div>
            </div>
            <h2>Authentication</h2>
            <p>Pass your API key via the <span className="b">Authorization</span> header on every request.</p>
            <div className="cb">
              <div className="cb-head"><span></span><button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>Authorization: Bearer cadre_sk_live_xxxxxxxx</pre>
              </div>
            </div>
            <h2>Quickstart</h2>
            <div className="cb">
              <div className="cb-head">curl<button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>{`curl "https://api.cadre.careers/v1/jobs?\\
function=engineering&\\
seniority=senior&\\
investor=andreessen-horowitz" \\
  -H "Authorization: Bearer cadre_sk_live_xxxxxxxx"`}</pre>
              </div>
            </div>
            <div className="cb">
              <div className="cb-head">Response</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;data&quot;</span>{`: [{
    `}<span className="cv">&quot;id&quot;</span>{`: "job_8xk2m9",
    `}<span className="cv">&quot;title&quot;</span>{`: "Senior Software Engineer, Platform",
    `}<span className="cv">&quot;function&quot;</span>{`: "engineering",
    `}<span className="cv">&quot;seniority&quot;</span>{`: "senior",
    `}<span className="cv">&quot;location&quot;</span>{`: "New York, NY",
    `}<span className="cv">&quot;freshness&quot;</span>{`: "4h",
    `}<span className="cv">&quot;company&quot;</span>{`: {
      `}<span className="cv">&quot;name&quot;</span>{`: "Ramp",
      `}<span className="cv">&quot;stage&quot;</span>{`: "series_d",
      `}<span className="cv">&quot;hiring_velocity_30d&quot;</span>{`: 1.34
    },
    `}<span className="cv">&quot;investors&quot;</span>{`: [
      { `}<span className="cv">&quot;name&quot;</span>{`: "Founders Fund" },
      { `}<span className="cv">&quot;name&quot;</span>{`: "Thrive Capital" }
    ]
  }],
  `}<span className="cv">&quot;meta&quot;</span>{`: { `}<span className="cv">&quot;total&quot;</span>{`: 847, `}<span className="cv">&quot;has_more&quot;</span>{`: true }
}`}</pre>
              </div>
            </div>
            <h2>Rate limits</h2>
            <p>Limits are per API key. A &quot;record&quot; is one object in the <span className="b">data</span> array.</p>
            <div className="params">
              <div className="pr"><span className="n">Developer</span><span className="i">60 req/min &middot; 10K records/mo</span></div>
              <div className="pr"><span className="n">Growth</span><span className="i">300 req/min &middot; 100K records/mo</span></div>
              <div className="pr"><span className="n">Enterprise</span><span className="i">Custom</span></div>
            </div>
            <h2>Errors</h2>
            <p>Standard HTTP status codes. Every error includes a machine-readable <span className="b">code</span> and <span className="b">message</span>.</p>
            <div className="cb">
              <div className="cb-head">Error response</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;error&quot;</span>{`: {
    `}<span className="cv">&quot;code&quot;</span>{`: "rate_limit_exceeded",
    `}<span className="cv">&quot;message&quot;</span>{`: "60 requests per minute exceeded.",
    `}<span className="cv">&quot;status&quot;</span>{`: 429
  }
}`}</pre>
              </div>
            </div>
            <div className="params">
              <div className="pr"><span className="n">400</span><span className="i">invalid_request</span></div>
              <div className="pr"><span className="n">401</span><span className="i">unauthorized</span></div>
              <div className="pr"><span className="n">403</span><span className="i">forbidden</span></div>
              <div className="pr"><span className="n">404</span><span className="i">not_found</span></div>
              <div className="pr"><span className="n">429</span><span className="i">rate_limit_exceeded</span></div>
              <div className="pr"><span className="n">500</span><span className="i">internal_error</span></div>
            </div>
            <span className="next-link" onClick={() => navTo('jobs')}>Endpoints: Jobs &rarr;</span>
          </div>

          {/* ─── Jobs ─── */}
          <div className={`pg ${activePage === 'jobs' ? 'active' : ''}`} id="jobs">
            <h1>Jobs</h1>
            <p>Search and retrieve job records. Every job includes its parent company, investors, and industry context.</p>
            <div className="ep">
              <span className="ep-method">GET</span>
              <span className="ep-path">/v1/jobs</span>
            </div>
            <div className="cb">
              <div className="cb-head">Request<button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>{`GET /v1/jobs
  ?function=`}<span className="cv">engineering</span>{`
  &seniority=`}<span className="cv">senior,staff</span>{`
  &company_stage=`}<span className="cv">series_b,series_c,growth</span>{`
  &investor=`}<span className="cv">andreessen-horowitz</span>{`
  &industry=`}<span className="cv">fintech</span>{`
  &location=`}<span className="cv">new-york</span>{`
  &posted_after=`}<span className="cv">2025-01-15</span>{`
  &sort=`}<span className="cv">posted_at_desc</span>{`
  &limit=`}<span className="cv">50</span></pre>
              </div>
            </div>
            <h2>Parameters</h2>
            <div className="params">
              <div className="pr"><span className="n">function</span><span className="i">string — engineering, product, design, sales, marketing, ai_research, etc.</span></div>
              <div className="pr"><span className="n">seniority</span><span className="i">string — intern, junior, mid, senior, staff, principal, director, vp, c_level</span></div>
              <div className="pr"><span className="n">company_stage</span><span className="i">string — seed, series_a, series_b, series_c, growth</span></div>
              <div className="pr"><span className="n">investor</span><span className="i">string — investor slug. Returns jobs at portfolio companies.</span></div>
              <div className="pr"><span className="n">industry</span><span className="i">string — fintech, ai_ml, developer_tools, healthtech, etc.</span></div>
              <div className="pr"><span className="n">location</span><span className="i">string — location slug or &quot;remote&quot;</span></div>
              <div className="pr"><span className="n">posted_after</span><span className="i">date — ISO 8601</span></div>
              <div className="pr"><span className="n">sort</span><span className="i">string — posted_at_desc, hiring_velocity_desc, total_raised_desc</span></div>
              <div className="pr"><span className="n">limit</span><span className="i">integer — default 25, max 100</span></div>
              <div className="pr"><span className="n">cursor</span><span className="i">string — pagination cursor from previous response</span></div>
            </div>
            <h2>Response</h2>
            <div className="cb">
              <div className="cb-head">200 OK</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;data&quot;</span>{`: [{
    `}<span className="cv">&quot;id&quot;</span>{`: "job_8xk2m9",
    `}<span className="cv">&quot;title&quot;</span>{`: "Senior Software Engineer, Platform",
    `}<span className="cv">&quot;function&quot;</span>{`: "engineering",
    `}<span className="cv">&quot;seniority&quot;</span>{`: "senior",
    `}<span className="cv">&quot;location&quot;</span>{`: "New York, NY",
    `}<span className="cv">&quot;remote_policy&quot;</span>{`: "hybrid",
    `}<span className="cv">&quot;posted_at&quot;</span>{`: "2025-02-10T00:00:00Z",
    `}<span className="cv">&quot;freshness&quot;</span>{`: "4h",
    `}<span className="cv">&quot;apply_url&quot;</span>{`: "https://boards.greenhouse.io/...",
    `}<span className="cv">&quot;company&quot;</span>{`: {
      `}<span className="cv">&quot;name&quot;</span>{`: "Ramp",
      `}<span className="cv">&quot;slug&quot;</span>{`: "ramp",
      `}<span className="cv">&quot;stage&quot;</span>{`: "series_d",
      `}<span className="cv">&quot;industry&quot;</span>{`: "fintech",
      `}<span className="cv">&quot;size&quot;</span>{`: "500-1000",
      `}<span className="cv">&quot;total_raised&quot;</span>{`: 1600000000,
      `}<span className="cv">&quot;hiring_velocity_30d&quot;</span>{`: 1.34
    },
    `}<span className="cv">&quot;investors&quot;</span>{`: [
      { `}<span className="cv">&quot;name&quot;</span>{`: "Founders Fund", `}<span className="cv">&quot;slug&quot;</span>{`: "founders-fund" },
      { `}<span className="cv">&quot;name&quot;</span>{`: "Thrive Capital", `}<span className="cv">&quot;slug&quot;</span>{`: "thrive-capital" }
    ]
  }],
  `}<span className="cv">&quot;meta&quot;</span>{`: {
    `}<span className="cv">&quot;total&quot;</span>{`: 847,
    `}<span className="cv">&quot;has_more&quot;</span>{`: true,
    `}<span className="cv">&quot;cursor&quot;</span>{`: "eyJpZCI6MTAwfQ=="
  }
}`}</pre>
              </div>
            </div>
            <hr />
            <div className="ep">
              <span className="ep-method">GET</span>
              <span className="ep-path">/v1/jobs/{'{id}'}</span>
            </div>
            <p>Returns a single job by ID with full context.</p>
          </div>

          {/* ─── Companies ─── */}
          <div className={`pg ${activePage === 'companies' ? 'active' : ''}`} id="companies">
            <h1>Companies</h1>
            <p>Company profiles with real-time hiring metrics, investor relationships, and open role counts.</p>
            <div className="ep">
              <span className="ep-method">GET</span>
              <span className="ep-path">/v1/companies</span>
            </div>
            <div className="cb">
              <div className="cb-head">Request<button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>{`GET /v1/companies
  ?industry=`}<span className="cv">ai_ml</span>{`
  &stage=`}<span className="cv">series_b,series_c</span>{`
  &min_open_roles=`}<span className="cv">10</span>{`
  &investor=`}<span className="cv">sequoia</span>{`
  &sort=`}<span className="cv">hiring_velocity_desc</span></pre>
              </div>
            </div>
            <h2>Parameters</h2>
            <div className="params">
              <div className="pr"><span className="n">industry</span><span className="i">string — sector filter</span></div>
              <div className="pr"><span className="n">stage</span><span className="i">string — funding stage filter</span></div>
              <div className="pr"><span className="n">min_open_roles</span><span className="i">integer — minimum active postings</span></div>
              <div className="pr"><span className="n">investor</span><span className="i">string — filter by investor portfolio</span></div>
              <div className="pr"><span className="n">sort</span><span className="i">string — hiring_velocity_desc, open_roles_desc, total_raised_desc</span></div>
              <div className="pr"><span className="n">limit</span><span className="i">integer — default 25, max 100</span></div>
              <div className="pr"><span className="n">cursor</span><span className="i">string — pagination cursor</span></div>
            </div>
            <h2>Response</h2>
            <div className="cb">
              <div className="cb-head">200 OK</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;data&quot;</span>{`: [{
    `}<span className="cv">&quot;id&quot;</span>{`: "co_9xm3k2",
    `}<span className="cv">&quot;name&quot;</span>{`: "Anthropic",
    `}<span className="cv">&quot;slug&quot;</span>{`: "anthropic",
    `}<span className="cv">&quot;stage&quot;</span>{`: "series_d",
    `}<span className="cv">&quot;industry&quot;</span>{`: "ai_ml",
    `}<span className="cv">&quot;size&quot;</span>{`: "500-1000",
    `}<span className="cv">&quot;hq&quot;</span>{`: "San Francisco, CA",
    `}<span className="cv">&quot;total_raised&quot;</span>{`: 7300000000,
    `}<span className="cv">&quot;ats_platform&quot;</span>{`: "greenhouse",
    `}<span className="cv">&quot;hiring&quot;</span>{`: {
      `}<span className="cv">&quot;open_roles&quot;</span>{`: 72,
      `}<span className="cv">&quot;velocity_30d&quot;</span>{`: 1.34,
      `}<span className="cv">&quot;new_roles_30d&quot;</span>{`: 18,
      `}<span className="cv">&quot;top_functions&quot;</span>{`: ["engineering", "ai_research", "product"]
    },
    `}<span className="cv">&quot;investors&quot;</span>{`: [
      { `}<span className="cv">&quot;name&quot;</span>{`: "Google", `}<span className="cv">&quot;slug&quot;</span>{`: "google" },
      { `}<span className="cv">&quot;name&quot;</span>{`: "Spark Capital", `}<span className="cv">&quot;slug&quot;</span>{`: "spark-capital" }
    ],
    `}<span className="cv">&quot;freshness&quot;</span>{`: "2h"
  }],
  `}<span className="cv">&quot;meta&quot;</span>{`: { `}<span className="cv">&quot;total&quot;</span>{`: 312, `}<span className="cv">&quot;has_more&quot;</span>{`: true }
}`}</pre>
              </div>
            </div>
            <hr />
            <div className="ep">
              <span className="ep-method">GET</span>
              <span className="ep-path">/v1/companies/{'{slug}'}</span>
            </div>
            <p>Single company with full hiring breakdown by function.</p>
            <div className="ep">
              <span className="ep-method">GET</span>
              <span className="ep-path">/v1/companies/{'{slug}'}/jobs</span>
            </div>
            <p>All open roles at a specific company.</p>
          </div>

          {/* ─── Investors ─── */}
          <div className={`pg ${activePage === 'investors' ? 'active' : ''}`} id="investors">
            <h1>Investors</h1>
            <p>Investor portfolios through the lens of hiring activity.</p>
            <div className="ep">
              <span className="ep-method">GET</span>
              <span className="ep-path">/v1/investors</span>
            </div>
            <div className="cb">
              <div className="cb-head">Request<button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>{`GET /v1/investors
  ?min_portfolio_companies=`}<span className="cv">10</span>{`
  &sort=`}<span className="cv">portfolio_open_roles_desc</span></pre>
              </div>
            </div>
            <h2>Response</h2>
            <div className="cb">
              <div className="cb-head">200 OK</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;data&quot;</span>{`: [{
    `}<span className="cv">&quot;id&quot;</span>{`: "inv_2km49x",
    `}<span className="cv">&quot;name&quot;</span>{`: "Andreessen Horowitz",
    `}<span className="cv">&quot;slug&quot;</span>{`: "andreessen-horowitz",
    `}<span className="cv">&quot;portfolio&quot;</span>{`: {
      `}<span className="cv">&quot;companies_tracked&quot;</span>{`: 48,
      `}<span className="cv">&quot;total_open_roles&quot;</span>{`: 1240,
      `}<span className="cv">&quot;top_industries&quot;</span>{`: ["ai_ml", "fintech", "dev_tools"],
      `}<span className="cv">&quot;hiring_momentum&quot;</span>{`: "accelerating"
    }
  }],
  `}<span className="cv">&quot;meta&quot;</span>{`: { `}<span className="cv">&quot;total&quot;</span>{`: 89, `}<span className="cv">&quot;has_more&quot;</span>{`: true }
}`}</pre>
              </div>
            </div>
            <hr />
            <div className="ep">
              <span className="ep-method">GET</span>
              <span className="ep-path">/v1/investors/{'{slug}'}/portfolio</span>
            </div>
            <p>All portfolio companies with hiring data.</p>
            <div className="cb">
              <div className="cb-head">200 OK</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;investor&quot;</span>{`: "Andreessen Horowitz",
  `}<span className="cv">&quot;companies&quot;</span>{`: [{
    `}<span className="cv">&quot;name&quot;</span>{`: "Ramp",
    `}<span className="cv">&quot;slug&quot;</span>{`: "ramp",
    `}<span className="cv">&quot;stage&quot;</span>{`: "series_d",
    `}<span className="cv">&quot;open_roles&quot;</span>{`: 34,
    `}<span className="cv">&quot;velocity_30d&quot;</span>{`: 1.8,
    `}<span className="cv">&quot;top_function&quot;</span>{`: "engineering",
    `}<span className="cv">&quot;freshness&quot;</span>{`: "2h"
  }],
  `}<span className="cv">&quot;meta&quot;</span>{`: { `}<span className="cv">&quot;total&quot;</span>{`: 48 }
}`}</pre>
              </div>
            </div>
          </div>

          {/* ─── Signals ─── */}
          <div className={`pg ${activePage === 'signals' ? 'active' : ''}`} id="signals">
            <h1>Signals</h1>
            <p>Pattern-level hiring intelligence. Detects changes across the graph that individual job listings can&apos;t surface.</p>
            <div className="ep">
              <span className="ep-method">GET</span>
              <span className="ep-path">/v1/signals</span>
            </div>
            <div className="cb">
              <div className="cb-head">Request<button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>{`GET /v1/signals
  ?type=`}<span className="cv">hiring_surge,first_role</span>{`
  &industry=`}<span className="cv">fintech</span>{`
  &min_confidence=`}<span className="cv">0.7</span>{`
  &since=`}<span className="cv">2025-02-01</span>{`
  &limit=`}<span className="cv">25</span></pre>
              </div>
            </div>
            <h2>Parameters</h2>
            <div className="params">
              <div className="pr"><span className="n">type</span><span className="i">string — hiring_surge, first_role, gtm_shift, fundraise_indicator</span></div>
              <div className="pr"><span className="n">industry</span><span className="i">string — filter by sector</span></div>
              <div className="pr"><span className="n">investor</span><span className="i">string — filter by investor portfolio</span></div>
              <div className="pr"><span className="n">min_confidence</span><span className="i">float — 0.0 to 1.0</span></div>
              <div className="pr"><span className="n">since</span><span className="i">date — signals detected after this date</span></div>
              <div className="pr"><span className="n">limit</span><span className="i">integer — default 25, max 100</span></div>
              <div className="pr"><span className="n">cursor</span><span className="i">string — pagination cursor</span></div>
            </div>
            <h2>Response</h2>
            <div className="cb">
              <div className="cb-head">200 OK</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;data&quot;</span>{`: [{
    `}<span className="cv">&quot;type&quot;</span>{`: "hiring_surge",
    `}<span className="cv">&quot;confidence&quot;</span>{`: 0.92,
    `}<span className="cv">&quot;company&quot;</span>{`: {
      `}<span className="cv">&quot;name&quot;</span>{`: "Mercury",
      `}<span className="cv">&quot;slug&quot;</span>{`: "mercury",
      `}<span className="cv">&quot;stage&quot;</span>{`: "series_c"
    },
    `}<span className="cv">&quot;detail&quot;</span>{`: "Engineering headcount +340% in 30d (3 → 13 open roles)",
    `}<span className="cv">&quot;detected_at&quot;</span>{`: "2025-02-12T00:00:00Z",
    `}<span className="cv">&quot;evidence&quot;</span>{`: {
      `}<span className="cv">&quot;roles_added&quot;</span>{`: 10,
      `}<span className="cv">&quot;primary_function&quot;</span>{`: "engineering",
      `}<span className="cv">&quot;velocity_change&quot;</span>{`: 3.4
    }
  },
  {
    `}<span className="cv">&quot;type&quot;</span>{`: "first_role",
    `}<span className="cv">&quot;confidence&quot;</span>{`: 0.88,
    `}<span className="cv">&quot;company&quot;</span>{`: {
      `}<span className="cv">&quot;name&quot;</span>{`: "Brex",
      `}<span className="cv">&quot;slug&quot;</span>{`: "brex",
      `}<span className="cv">&quot;stage&quot;</span>{`: "series_d"
    },
    `}<span className="cv">&quot;detail&quot;</span>{`: "First Head of AI role — potential new product vertical",
    `}<span className="cv">&quot;detected_at&quot;</span>{`: "2025-02-11T00:00:00Z"
  }],
  `}<span className="cv">&quot;meta&quot;</span>{`: { `}<span className="cv">&quot;total&quot;</span>{`: 23, `}<span className="cv">&quot;has_more&quot;</span>{`: false }
}`}</pre>
              </div>
            </div>
            <h2>Signal types</h2>
            <div className="params">
              <div className="pr"><span className="n">hiring_surge</span><span className="i">Abnormal velocity increase in a specific function</span></div>
              <div className="pr"><span className="n">first_role</span><span className="i">New function or seniority never posted before</span></div>
              <div className="pr"><span className="n">gtm_shift</span><span className="i">Hiring mix indicates go-to-market pivot</span></div>
              <div className="pr"><span className="n">fundraise_indicator</span><span className="i">Patterns consistent with recent or upcoming raise</span></div>
            </div>
          </div>

          {/* ─── Batch ─── */}
          <div className={`pg ${activePage === 'batch' ? 'active' : ''}`} id="batch">
            <h1>Batch</h1>
            <p>Enrich up to 100 companies in a single call. Built for agent workflows that process entities in bulk.</p>
            <div className="ep">
              <span className="ep-method">POST</span>
              <span className="ep-path">/v1/companies/batch</span>
            </div>
            <div className="cb">
              <div className="cb-head">Request<button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;identifiers&quot;</span>{`: ["ramp", "mercury", "anthropic", "vercel"],
  `}<span className="cv">&quot;fields&quot;</span>{`: ["hiring", "investors", "stage", "industry"]
}`}</pre>
              </div>
            </div>
            <h2>Parameters</h2>
            <div className="params">
              <div className="pr"><span className="n">identifiers</span><span className="i">string[] — slugs, domains, or names. Max 100.</span></div>
              <div className="pr"><span className="n">fields</span><span className="i">string[] — which fields to return. Omit for all.</span></div>
            </div>
            <h2>Response</h2>
            <div className="cb">
              <div className="cb-head">200 OK</div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;data&quot;</span>{`: [
    {
      `}<span className="cv">&quot;identifier&quot;</span>{`: "ramp",
      `}<span className="cv">&quot;match&quot;</span>{`: true,
      `}<span className="cv">&quot;company&quot;</span>{`: {
        `}<span className="cv">&quot;name&quot;</span>{`: "Ramp",
        `}<span className="cv">&quot;stage&quot;</span>{`: "series_d",
        `}<span className="cv">&quot;industry&quot;</span>{`: "fintech",
        `}<span className="cv">&quot;hiring&quot;</span>{`: { `}<span className="cv">&quot;open_roles&quot;</span>{`: 34, `}<span className="cv">&quot;velocity_30d&quot;</span>{`: 1.8 },
        `}<span className="cv">&quot;investors&quot;</span>{`: [{ `}<span className="cv">&quot;name&quot;</span>{`: "Founders Fund" }]
      }
    },
    {
      `}<span className="cv">&quot;identifier&quot;</span>{`: "some-unknown-co",
      `}<span className="cv">&quot;match&quot;</span>{`: false,
      `}<span className="cv">&quot;company&quot;</span>{`: null
    }
  ],
  `}<span className="cv">&quot;meta&quot;</span>{`: { `}<span className="cv">&quot;matched&quot;</span>{`: 4, `}<span className="cv">&quot;unmatched&quot;</span>{`: 0 }
}`}</pre>
              </div>
            </div>
          </div>

          {/* ─── Example Queries ─── */}
          <div className={`pg ${activePage === 'examples' ? 'active' : ''}`} id="examples">
            <h1>Example Queries</h1>
            <p>Cross-dimensional queries that traverse the knowledge graph. Each is a single API call.</p>
            <hr />
            <h2 style={{ marginTop: 0 }}>Inbound agents</h2>
            <p className="d" style={{ fontSize: 11, marginBottom: 12 }}>Career copilots &middot; job matching &middot; talent marketplaces</p>
            <div className="qb">
              <div className="qb-q">&quot;Series B fintech companies backed by a16z that are hiring senior engineers in New York.&quot;</div>
              <div className="qb-w">Traverses jobs &times; companies &times; investors &times; location. Three separate APIs and manual joining today.</div>
            </div>
            <div className="qb">
              <div className="qb-q">&quot;Product design roles at companies that raised in the last 6 months with fewer than 50 employees.&quot;</div>
              <div className="qb-w">Requires funding recency + headcount data that job boards don&apos;t carry.</div>
            </div>
            <div className="qb">
              <div className="qb-q">&quot;Rank these roles by company growth velocity and investor quality. Last 7 days only.&quot;</div>
              <div className="qb-w">Turns a job list into a scored recommendation using signals no single provider has.</div>
            </div>
            <hr />
            <h2 style={{ marginTop: 0 }}>Outbound agents</h2>
            <p className="d" style={{ fontSize: 11, marginBottom: 12 }}>AI sourcing &middot; recruiter automation &middot; market intelligence</p>
            <div className="qb">
              <div className="qb-q">&quot;Companies with 5+ open engineering roles but zero recruiter postings.&quot;</div>
              <div className="qb-w">Buying signal for recruiting agencies. Detecting absence requires full hiring profile context.</div>
            </div>
            <div className="qb">
              <div className="qb-q">&quot;Company X just raised Series B. What did comparable companies hire for in the 6 months post-raise?&quot;</div>
              <div className="qb-w">Predictive patterns — anticipate roles before they&apos;re posted from stage-matched historical data.</div>
            </div>
            <div className="qb">
              <div className="qb-q">&quot;Which portfolio companies just posted their first Head of Sales?&quot;</div>
              <div className="qb-w">First-of-kind role detection. New sales leadership = entering a new phase.</div>
            </div>
            <hr />
            <h2 style={{ marginTop: 0 }}>Signals</h2>
            <p className="d" style={{ fontSize: 11, marginBottom: 12 }}>Hiring is the most honest signal a company emits.</p>
            <div className="qb">
              <div className="qb-q">&quot;Hiring velocity trend for AI infrastructure — who&apos;s accelerating vs. decelerating?&quot;</div>
              <div className="qb-w">Velocity changes are leading indicators of growth, contraction, or pivots.</div>
            </div>
            <div className="qb">
              <div className="qb-q">&quot;Companies where engineering postings increased 50%+ in 30 days but haven&apos;t announced a fundraise.&quot;</div>
              <div className="qb-w">Hiring surges often precede fundraise announcements.</div>
            </div>
            <div className="qb">
              <div className="qb-q">&quot;Compare hiring between Sequoia-backed and Founders Fund-backed companies in developer tools.&quot;</div>
              <div className="qb-w">Portfolio-level analysis reveals investor thesis differences through headcount allocation.</div>
            </div>
          </div>

          {/* ─── Integrations ─── */}
          <div className={`pg ${activePage === 'integrations' ? 'active' : ''}`} id="integrations">
            <h1>Integrations</h1>
            <p>Ships in the formats your agent stack already consumes.</p>
            <hr />
            <h2 style={{ marginTop: 0 }}>REST API</h2>
            <p>JSON endpoints with cursor pagination. Works with any language or framework.</p>
            <h2>OpenAI Function Calling</h2>
            <p>Pre-built JSON Schema tool definitions. Drop into your agent&apos;s tools array.</p>
            <div className="cb">
              <div className="cb-head">Tool definition<button className="cb-copy" onClick={(e) => copyCode(e.currentTarget)}>Copy</button></div>
              <div className="cb-body">
<pre>{`{
  `}<span className="cv">&quot;type&quot;</span>{`: "function",
  `}<span className="cv">&quot;function&quot;</span>{`: {
    `}<span className="cv">&quot;name&quot;</span>{`: "cadre_search_jobs",
    `}<span className="cv">&quot;description&quot;</span>{`: "Search VC-backed job postings with graph-connected filters",
    `}<span className="cv">&quot;parameters&quot;</span>{`: {
      `}<span className="cv">&quot;type&quot;</span>{`: "object",
      `}<span className="cv">&quot;properties&quot;</span>{`: {
        `}<span className="cv">&quot;function&quot;</span>{`: { `}<span className="cv">&quot;type&quot;</span>{`: "string" },
        `}<span className="cv">&quot;seniority&quot;</span>{`: { `}<span className="cv">&quot;type&quot;</span>{`: "string" },
        `}<span className="cv">&quot;investor&quot;</span>{`: { `}<span className="cv">&quot;type&quot;</span>{`: "string" },
        `}<span className="cv">&quot;company_stage&quot;</span>{`: { `}<span className="cv">&quot;type&quot;</span>{`: "string" },
        `}<span className="cv">&quot;industry&quot;</span>{`: { `}<span className="cv">&quot;type&quot;</span>{`: "string" },
        `}<span className="cv">&quot;posted_within_days&quot;</span>{`: { `}<span className="cv">&quot;type&quot;</span>{`: "integer" }
      }
    }
  }
}`}</pre>
              </div>
            </div>
            <h2>Anthropic MCP</h2>
            <p>Model Context Protocol server for native tool discovery in Claude-based agents.</p>
            <div className="foot">
              <p>Tool schemas, MCP config, and sandbox key provided during onboarding.</p>
              <a href="https://YOUR_LOOPS_FORM_URL" target="_blank" rel="noopener noreferrer" className="foot-link">Contact us &rarr;</a>
            </div>
          </div>

          {/* ─── Access ─── */}
          <div className={`pg ${activePage === 'access' ? 'active' : ''}`} id="access">
            <h1>Request Access</h1>
            <p>CADRE is in private beta. We&apos;re onboarding AI recruiting companies as design partners.</p>
            <hr />
            <h2 style={{ marginTop: 0 }}>What you get</h2>
            <p>Sandbox API key with access to the full knowledge graph. We&apos;ll tailor the integration to your agent architecture.</p>
            <h2>Who this is for</h2>
            <p>Teams building AI-powered recruiting tools — career copilots, sourcing agents, talent marketplaces, recruiter automation, hiring analytics.</p>
            <div className="foot">
              <p>Tell us what you&apos;re building.</p>
              <a href="https://YOUR_LOOPS_FORM_URL" target="_blank" rel="noopener noreferrer" className="foot-link">Contact us &rarr;</a>
            </div>
            <p style={{ marginTop: 48, fontSize: 11, color: 'var(--text-dim)' }}>
              &copy; 2026 Cadre Talent Intelligence &ensp;&middot;&ensp; Privacy
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
