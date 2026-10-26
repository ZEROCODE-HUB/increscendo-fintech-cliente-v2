import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

const isChunkLoadError = (error: Error): boolean => {
  const msg = error.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Importing a module script failed') ||
    error.name === 'TypeError'
  );
};

export class ChunkLoadErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (!isChunkLoadError(error)) {
      this.setState({ hasError: false });
      return;
    }

    console.warn('[ChunkLoadErrorBoundary] Chunk load failed, verifying server...');

    fetch('/', { method: 'HEAD', cache: 'no-store' })
      .then((resp) => {
        if (resp.ok) {
          window.location.reload();
        } else {
          console.error('[ChunkLoadErrorBoundary] Server returned', resp.status);
          this.setState({ hasError: false });
        }
      })
      .catch(() => {
        console.error('[ChunkLoadErrorBoundary] Server unreachable');
        this.setState({ hasError: false });
      });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Actualizando...</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
