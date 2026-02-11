'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0e0e0f', margin: 0 }}>
        <main style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center', padding: '0 1rem' }}>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#fff', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginBottom: '1.5rem' }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#5e6ad2',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
