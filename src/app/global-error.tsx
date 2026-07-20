'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Global error:', error);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafafa', margin: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
          }}
        >
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <h1 style={{ color: '#3a3a3a', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#555', marginBottom: '1.5rem' }}>
              Sorry — the site hit a problem. Please try again, or call +1 832-670-6705 and
              we&apos;ll help you directly.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#00473c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
