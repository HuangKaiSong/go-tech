'use client';

import { useEffect } from 'react';
import { captureBrowserError } from '@/lib/browser-monitor/client';

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    captureBrowserError(error, { kind: 'react', digest: error.digest });
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
