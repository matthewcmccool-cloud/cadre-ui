import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cadre',
  description: 'A curated and enriched graph of the companies that matter most. Real-time hiring, funding, and investor intelligence for AI agents, venture capital, and capital markets.',
  alternates: { canonical: 'https://cadre.careers' },
};

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');

        /* Hide app chrome from root layout */
        header.sticky, footer.py-16,
        nav.fixed, nav.sticky { display: none !important; }

        body {
          background: #000 !important;
          color: #888 !important;
          font-family: 'Geist Mono', monospace !important;
          font-size: 0.875rem !important;
          line-height: 1.7 !important;
          min-height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          padding: 3rem !important;
          -webkit-font-smoothing: antialiased !important;
        }

        .lp { max-width: 480px; }
        .lp-logo { color: #ededed; font-weight: 500; margin-bottom: 1.5rem; }
        .lp-logo span { color: #9d8ec7; }
        .lp p { margin-bottom: 2rem; color: #888; }
        .lp a { color: #555; text-decoration: none; transition: color 0.15s; }
        .lp a:hover { color: #ededed; }
        .lp-links { display: flex; gap: 1.5rem; margin-bottom: 2rem; }
        .lp-meta { color: #333; font-size: 0.75rem; }
        .lp-meta a { color: #333; }
        .lp-meta a:hover { color: #555; }

        @media (max-width: 640px) {
          body { padding: 2rem 1.25rem !important; }
        }
      `}</style>

      <div className="lp">
        <div className="lp-logo">CADRE <span>&middot;</span></div>
        <p>A curated and enriched graph of the companies that matter most. Real-time hiring, funding, and investor intelligence for AI agents, venture capital, and capital markets.</p>
        <div className="lp-links">
          <Link href="/docs">Docs</Link>
          <a href="mailto:matt@cadre.careers">Contact</a>
        </div>
        <div className="lp-meta">&copy; 2026 Cadre Talent Intelligence &middot; <Link href="/privacy">Privacy</Link></div>
      </div>
    </>
  );
}
