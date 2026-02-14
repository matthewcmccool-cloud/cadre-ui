import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Cadre',
  description: 'Cadre privacy policy — how we handle your data.',
  alternates: { canonical: 'https://cadre.careers/privacy' },
};

export default function PrivacyPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        /* Hide app chrome from root layout — Header renders <header>, Footer renders <footer> */
        body > header, body > footer,
        header.sticky, footer.py-16,
        nav.fixed, nav.sticky { display: none !important; }

        .pp * { box-sizing: border-box; margin: 0; padding: 0; }
        .pp {
          min-height: 100vh;
          background: #09090b;
          color: #a1a1aa;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          padding: 0 24px;
        }
        .pp-inner {
          max-width: 600px;
          margin: 0 auto;
          padding: 64px 0 48px;
        }
        .pp-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #52525b;
          text-decoration: none;
          transition: color 0.15s;
          margin-bottom: 48px;
        }
        .pp-back:hover { color: #a1a1aa; }
        .pp-title {
          font-size: 28px;
          font-weight: 600;
          color: #fafafa;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .pp-date {
          font-size: 13px;
          color: #52525b;
          margin-bottom: 48px;
        }
        .pp h2 {
          font-size: 16px;
          font-weight: 600;
          color: #e4e4e7;
          margin-top: 36px;
          margin-bottom: 12px;
        }
        .pp p {
          font-size: 14px;
          line-height: 1.7;
          color: #71717a;
          margin-bottom: 16px;
        }
        .pp ul {
          list-style: none;
          padding: 0;
          margin-bottom: 16px;
        }
        .pp li {
          font-size: 14px;
          line-height: 1.7;
          color: #71717a;
          padding-left: 16px;
          position: relative;
          margin-bottom: 4px;
        }
        .pp li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 10px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #3f3f46;
        }
        .pp-divider {
          border: none;
          border-top: 1px solid #1c1c1e;
          margin: 48px 0 32px;
        }
        .pp-footer {
          font-size: 13px;
          color: #3f3f46;
        }

        @media (max-width: 640px) {
          .pp-inner { padding: 40px 0 32px; }
          .pp-title { font-size: 24px; }
          .pp-back { margin-bottom: 36px; }
        }
      `}</style>

      <div className="pp">
        <div className="pp-inner">
          <Link href="/" className="pp-back">&larr; Back to Cadre</Link>

          <h1 className="pp-title">Privacy Policy</h1>
          <p className="pp-date">Effective February 13, 2026</p>

          <h2>Overview</h2>
          <p>
            Cadre Talent Intelligence operates the cadre.careers website. This policy
            describes what information we collect through our contact form and how
            we use it.
          </p>

          <h2>Information We Collect</h2>
          <p>
            When you submit our contact form, we collect the following information:
          </p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Company name (optional)</li>
            <li>Message content</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>
            The information you provide is used solely to respond to your inquiry.
            We do not sell, rent, or share your personal information with third
            parties for marketing purposes.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            We do not use third-party advertising trackers. We may use basic
            analytics to understand aggregate site traffic. No personal information
            from form submissions is shared with analytics providers.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain contact form submissions for as long as necessary to respond
            to your inquiry and maintain our business relationship. You may request
            deletion of your data at any time.
          </p>

          <h2>Your Rights</h2>
          <p>
            You have the right to request access to, correction of, or deletion of
            your personal information. To exercise these rights, please submit a
            request through our contact form on the homepage.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Any changes will be
            reflected on this page with an updated effective date.
          </p>

          <hr className="pp-divider" />
          <div className="pp-footer">&copy; 2026 Cadre Talent Intelligence</div>
        </div>
      </div>
    </>
  );
}
