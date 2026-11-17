import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Disc } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#edf3fd] dark:bg-[#0c101c] text-[#142247] dark:text-[#f0f4fc] flex flex-col items-center justify-center p-6 text-center z-50 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center mb-4 text-[#142247] dark:text-[#9ab3f5] shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black mb-2 tracking-tight">PAPABVTIFY Pulih Otomatis</h2>
          <p className="text-sm text-[#5d729c] dark:text-[#8fa1c4] max-w-md mb-6 leading-relaxed">
            Terjadi kendala visual sementara. Sistem telah mengamankan audio player agar musik Anda tidak terganggu.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#142247] text-white dark:bg-[#9ab3f5] dark:text-[#142247] font-extrabold hover:opacity-90 transition active:scale-95 shadow-xl cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Tampilan</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
