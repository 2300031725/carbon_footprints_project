import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside EcoTrack React application:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-6 text-center">
          <div className="max-w-md bg-white dark:bg-slate-850 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <h1 className="text-2xl font-black text-rose-600 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              EcoTrack encountered an unexpected rendering error. Please try reloading the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="eco-gradient text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-eco-600/10"
            >
              Reload Page
            </button>
            {this.state.error && (
              <pre className="mt-6 text-3xs text-left bg-slate-100 dark:bg-slate-800 p-4 rounded-xl overflow-x-auto text-slate-500 max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
