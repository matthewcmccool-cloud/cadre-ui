import { redirect } from 'next/navigation';

/**
 * /unsubscribe — Redirects to Loops unsubscribe page.
 * Loops emails include an unsubscribe link with a subscriber-specific token.
 * This page handles the case where users land on /unsubscribe directly
 * (e.g., typed URL). If a Loops unsubscribe URL is provided via ?url param,
 * we redirect there; otherwise show a simple message.
 */
export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { url?: string };
}) {
  // If Loops provides a redirect URL, forward the user there
  if (searchParams.url) {
    redirect(searchParams.url);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-zinc-100">Unsubscribe</h1>
        <p className="mt-3 text-sm text-zinc-400">
          To unsubscribe, click the unsubscribe link in any Cadre email.
          Each email contains a personalized unsubscribe link that will
          remove you from that specific mailing list.
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          Need help? Contact{' '}
          <a href="mailto:matt@cadre.careers" className="text-purple-400 hover:text-purple-300">
            matt@cadre.careers
          </a>
        </p>
      </div>
    </main>
  );
}
