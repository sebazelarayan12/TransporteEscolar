import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-red-400">error</span>
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Algo salió mal
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {this.state.error?.message ?? 'Error inesperado'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
