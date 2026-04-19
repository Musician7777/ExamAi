'use client';
import { Component } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <Card className="max-w-md w-full p-8 text-center space-y-6 border-destructive/20 bg-card">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-muted-foreground leading-relaxed">
              An unexpected error occurred. Don&apos;t worry — your data is safe. Try refreshing the page or going back.
            </p>
            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-xs text-muted-foreground font-mono break-all">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="brand" onClick={this.handleReset} className="gap-2">
                🔄 Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReload} className="gap-2">
                ↻ Reload Page
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/dashboard')} className="gap-2">
                🏠 Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
