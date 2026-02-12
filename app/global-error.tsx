'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'sans-serif',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>エラーが発生しました</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            予期しないエラーが発生しました。もう一度お試しください。
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#1976d2',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            もう一度試す
          </button>
        </div>
      </body>
    </html>
  );
}
