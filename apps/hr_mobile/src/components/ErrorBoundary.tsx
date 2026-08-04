import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
}

const reloadPage = () => window.location.reload();

/** 全局错误边界：捕获渲染期异常，展示统一错误页面 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // oxlint-disable-next-line class-methods-use-this
  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('页面渲染出错:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-6 text-center">
        <h1 className="text-3xl font-bold">页面出错了</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {this.state.error?.message || '发生了未知错误，请稍后重试。'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={this.handleReset}>
            重试
          </Button>
          <Button onClick={reloadPage}>刷新页面</Button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
