'use client';

import { useEffect } from 'react';
import { captureBrowserError } from '@/lib/browser-monitor/client';

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Server errors with a digest are reported by onRequestError before hydration.
    if (!error.digest) captureBrowserError(error, { kind: 'react-client' });
  }, [error]);
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Something went wrong</h1>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
