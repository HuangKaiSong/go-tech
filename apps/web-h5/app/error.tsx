'use client';

import React, { Component, type ErrorInfo, type ReactNode, useEffect } from 'react';
import { captureBrowserError } from '@/lib/browser-monitor/client';
// import { sendToBetterStack } from '@/lib/betterstack-logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class GracefullyDegradingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private contentRef: React.RefObject<HTMLDivElement | null>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.contentRef = React.createRef();
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureBrowserError(error, { kind: 'react', componentStack: errorInfo.componentStack ?? undefined });
    if (this.props.onError) {
      // sendToBetterStack('error', error.message, errorInfo);
      this.props.onError(error, errorInfo);
    }
  }

  override render() {
    if (this.state.hasError) {
      // Render the current HTML content without hydration
      return (
        <>
          <div
            ref={this.contentRef}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: this.contentRef.current?.innerHTML || ''
            }}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white py-4 px-6 text-center">
            <p className="font-semibold">An error occurred during page rendering</p>
          </div>
        </>
      );
    }

    return <div ref={this.contentRef}>{this.props.children}</div>;
  }
}

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    captureBrowserError(error, { kind: 'react', digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <button type="button" onClick={retry} className="rounded border px-4 py-2">
        Try again
      </button>
    </main>
  );
}
