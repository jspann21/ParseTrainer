import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
            <h1 className="font-bold text-lg mb-2">Something went wrong.</h1>
            <p>Refresh the page to retry.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
