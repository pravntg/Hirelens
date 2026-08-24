import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Resumind ATS application:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errMsg = typeof this.state.error?.message === 'string'
        ? this.state.error.message
        : 'An unexpected rendering error occurred. Please refresh or try again.';

      return (
        <div className="min-h-screen bg-[#FFEDD5] flex items-center justify-center p-6 text-center">
          <div className="bg-white border border-[#FDBA74] rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 font-black text-xl flex items-center justify-center mx-auto">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-[#7C2D12]">Resumind ATS Notification</h2>
            <p className="text-xs text-[#9A3412] leading-relaxed font-medium">
              {String(errMsg)}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="bg-gradient-to-r from-[#EA580C] to-[#F97316] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all hover:scale-105"
              >
                Reset & Reload Resumind ATS
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
