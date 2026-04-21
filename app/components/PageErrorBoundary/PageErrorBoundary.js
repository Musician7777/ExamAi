'use client';
import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import clientLogger from '@/lib/client-logger';
import { trackError } from '@/lib/ga';

export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    clientLogger.error(
      '[PageErrorBoundary] ' + (this.props.pageName || 'Unknown page') + ' crashed:',
      error,
      errorInfo
    );
    trackError({
      errorName: error?.name || 'UnknownError',
      errorCategory: 'page_error:' + (this.props.pageName || 'unknown'),
      fatal: false,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const pageName = this.props.pageTitle || 'Page';
      const error = this.state.error;

      return (
        <div className="flex items-center justify-center min-h-[40vh] p-6">
          <Card className="max-w-lg w-full p-8 text-center space-y-5 border-destructive/20 bg-card shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-2">{pageName} encountered an error</h2>
            <p className="text-sm text-muted-foreground">
              Something went wrong loading this page. Your data is safe. Try refreshing or go back to dashboard.
            </p>
            {error?.message && process.env.NODE_ENV === 'development' && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-xs text-muted-foreground font-mono break-all text-left max-h-32 overflow-y-auto">
                {error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button variant="brand" onClick={this.handleReset} size="sm" className="gap-2">
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReload} size="sm" className="gap-2">
                Reload Page
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/dashboard')} size="sm" className="gap-2">
                Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
