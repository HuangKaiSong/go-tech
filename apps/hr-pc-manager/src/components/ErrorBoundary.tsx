import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  error?: Error;
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  static componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold">加载出错</h2>
            <p className="mt-2 text-sm text-muted-foreground">页面加载失败，请重试</p>
            {import.meta.env.DEV && this.state.error && (
              <p className="mt-2 text-xs text-muted-foreground">{this.state.error.message}</p>
            )}
            <Button onClick={this.reset} className="mt-6 gap-2" variant="default">
              <RefreshCw className="h-4 w-4" />
              重新加载
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
