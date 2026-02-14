'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', message: '' });

  const closeModal = useCallback(() => setShowModal(false), []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showModal, closeModal]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function openModal() {
    setFormData({ name: '', email: '', company: '', message: '' });
    setSubmitted(false);
    setShowModal(true);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        /* Hide app chrome from root layout — Header renders <header>, Footer renders <footer> */
        body > header, body > footer,
        header.sticky, footer.py-16,
        nav.fixed, nav.sticky { display: none !important; }

        .lp * { box-sizing: border-box; margin: 0; padding: 0; }
        .lp {
          position: relative;
          min-height: 100vh;
          background: #09090b;
          color: #fafafa;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* Override globals.css focus-visible opacity */
        .lp *:focus-visible { opacity: 1; }

        /* Subtle grid */
        .lp-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
          z-index: 0;
        }

        /* Top glow */
        .lp-glow {
          position: fixed;
          top: -40%;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 900px;
          background: radial-gradient(circle, rgba(157,142,199,.10) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .lp-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-height: 100vh;
          padding: 0 24px;
        }

        /* Logo */
        .lp-logo {
          margin-top: 80px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #a1a1aa;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lp-logo-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9d8ec7;
          display: inline-block;
        }

        /* Hero */
        .lp-hero {
          margin-top: 80px;
          text-align: center;
          max-width: 720px;
        }
        .lp-headline {
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #fafafa;
        }
        .lp-sub {
          margin-top: 28px;
          font-size: clamp(16px, 2vw, 19px);
          line-height: 1.65;
          color: #71717a;
          font-weight: 400;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Pricing bar */
        .lp-pricing {
          margin-top: 48px;
          display: flex;
          align-items: center;
          gap: 20px;
          font-size: 14px;
          color: #52525b;
          font-weight: 400;
        }
        .lp-pricing-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #3f3f46;
        }
        .lp-pricing-price {
          color: #a1a1aa;
          font-weight: 500;
        }

        /* CTA */
        .lp-cta {
          margin-top: 48px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: #9d8ec7;
          color: #09090b;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: -0.01em;
        }
        .lp-cta:hover {
          background: #b0a3d4;
        }
        .lp-cta:active {
          transform: scale(0.98);
        }

        /* Footer */
        .lp-footer {
          margin-top: auto;
          padding: 48px 0 32px;
          font-size: 13px;
          color: #3f3f46;
          text-align: center;
        }
        .lp-footer a {
          color: #52525b;
          text-decoration: none;
          transition: color 0.15s;
        }
        .lp-footer a:hover {
          color: #a1a1aa;
        }

        /* Modal overlay */
        .lp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: lpFadeIn 0.15s ease-out;
        }
        @keyframes lpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Modal */
        .lp-modal {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 40px;
          width: 100%;
          max-width: 440px;
          position: relative;
          animation: lpSlideUp 0.2s ease-out;
        }
        @keyframes lpSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #52525b;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: color 0.15s;
        }
        .lp-modal-close:hover { color: #a1a1aa; }
        .lp-modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 4px;
        }
        .lp-modal-desc {
          font-size: 14px;
          color: #71717a;
          margin-bottom: 28px;
        }
        .lp-field {
          margin-bottom: 16px;
        }
        .lp-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #a1a1aa;
          margin-bottom: 6px;
        }
        .lp-input {
          width: 100%;
          padding: 10px 14px;
          background: #09090b;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #fafafa;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .lp-input:focus {
          border-color: #9d8ec7;
        }
        .lp-input::placeholder {
          color: #3f3f46;
        }
        .lp-textarea {
          resize: vertical;
          min-height: 80px;
        }
        .lp-submit {
          width: 100%;
          margin-top: 8px;
          padding: 12px;
          background: #9d8ec7;
          color: #09090b;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .lp-submit:hover { background: #b0a3d4; }

        /* Thank you state */
        .lp-thanks {
          text-align: center;
          padding: 32px 0;
        }
        .lp-thanks-title {
          font-size: 20px;
          font-weight: 600;
          color: #fafafa;
          margin-bottom: 8px;
        }
        .lp-thanks-desc {
          font-size: 14px;
          color: #71717a;
        }

        @media (max-width: 640px) {
          .lp-logo { margin-top: 48px; }
          .lp-hero { margin-top: 56px; }
          .lp-pricing { flex-direction: column; gap: 8px; }
          .lp-pricing-sep { display: none; }
          .lp-modal { padding: 28px; }
        }
      `}</style>

      <div className="lp">
        <div className="lp-grid" />
        <div className="lp-glow" />

        <div className="lp-content">
          {/* Logo */}
          <div className="lp-logo">
            Cadre <span className="lp-logo-dot" />
          </div>

          {/* Hero */}
          <div className="lp-hero">
            <h1 className="lp-headline">
              The hiring intelligence API for the AI&nbsp;agent ecosystem.
            </h1>
            <p className="lp-sub">
              Real-time job postings connected to companies, investors, funding rounds, and industries across the venture economy. Structured and built for machines.
            </p>
          </div>

          {/* Pricing bar */}
          <div className="lp-pricing">
            <span className="lp-pricing-price">$999/mo</span>
            <span className="lp-pricing-sep" />
            <span>Full graph access</span>
            <span className="lp-pricing-sep" />
            <span>Real-time data</span>
          </div>

          {/* CTA */}
          <button className="lp-cta" onClick={openModal}>
            Get in Touch <span aria-hidden="true">&rarr;</span>
          </button>

          {/* Footer */}
          <div className="lp-footer">
            &copy; 2026 Cadre Talent Intelligence &middot;{' '}
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="lp-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-title"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <div className="lp-modal">
              <button className="lp-modal-close" onClick={closeModal} aria-label="Close">
                &times;
              </button>

              {submitted ? (
                <div className="lp-thanks">
                  <div className="lp-thanks-title">Thank you.</div>
                  <p className="lp-thanks-desc">We&rsquo;ll be in touch.</p>
                </div>
              ) : (
                <>
                  <div id="contact-title" className="lp-modal-title">Get in touch</div>
                  <p className="lp-modal-desc">Tell us about your use case.</p>
                  <form onSubmit={handleSubmit}>
                    <div className="lp-field">
                      <label htmlFor="contact-name" className="lp-label">Name</label>
                      <input
                        id="contact-name"
                        className="lp-input"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="lp-field">
                      <label htmlFor="contact-email" className="lp-label">Email</label>
                      <input
                        id="contact-email"
                        className="lp-input"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="lp-field">
                      <label htmlFor="contact-company" className="lp-label">Company</label>
                      <input
                        id="contact-company"
                        className="lp-input"
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                    <div className="lp-field">
                      <label htmlFor="contact-message" className="lp-label">Message</label>
                      <textarea
                        id="contact-message"
                        className="lp-input lp-textarea"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>
                    <button className="lp-submit" type="submit">Send</button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
