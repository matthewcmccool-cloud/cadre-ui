import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-16 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-sm text-zinc-500">
          Cadre &middot; Hiring Activity Intelligence
        </p>

        <div className="mt-4 flex items-center justify-center gap-1 text-sm text-zinc-500 flex-wrap">
          <Link href="/discover" className="hover:text-zinc-300 transition-colors px-2">
            Discover
          </Link>
          <span>&middot;</span>
          <Link href="/jobs" className="hover:text-zinc-300 transition-colors px-2">
            Browse Jobs
          </Link>
          <span>&middot;</span>
          <Link href="/investors" className="hover:text-zinc-300 transition-colors px-2">
            Browse Investors
          </Link>
          <span>&middot;</span>
          <Link href="/fundraises" className="hover:text-zinc-300 transition-colors px-2">
            Fundraises
          </Link>
          <span>&middot;</span>
          <Link href="/pricing" className="hover:text-zinc-300 transition-colors px-2">
            Pricing
          </Link>
          <span>&middot;</span>
          <a href="#newsletter" className="hover:text-zinc-300 transition-colors px-2">
            Newsletter
          </a>
        </div>

        <p className="mt-4 text-xs text-zinc-600">
          &copy; 2026 Cadre &middot;{' '}
          <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
          {' '}&middot;{' '}
          <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
          {' '}&middot;{' '}
          <a href="mailto:matt@cadre.careers" className="hover:text-zinc-400 transition-colors">Contact</a>
        </p>
      </div>
    </footer>
  );
}
