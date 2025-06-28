import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console and localStorage
    console.error('Supabase Error Boundary caught an error:', error, errorInfo);
    
    const errorLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      operation: 'error_boundary',
      status: 'error' as const,
      details: {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    };

    const existingLogs = JSON.parse(localStorage.getItem('supabase_logs') || '[]');
    existingLogs.unshift(errorLog);
    localStorage.setItem('supabase_logs', JSON.stringify(existingLogs.slice(0, 100)));
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-800 mb-2">
                Uygulama Hatası
              </h1>
              <p className="text-neutral-600">
                Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya destek ekibiyle iletişime geçin.
              </p>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Hata Detayları
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-neutral-700">Hata Mesajı:</span>
                  <p className="text-sm text-red-600 font-mono bg-white p-2 rounded mt-1">
                    {this.state.error?.message}
                  </p>
                </div>
                {this.state.error?.stack && (
                  <details className="mt-2">
                    <summary className="text-sm font-medium text-neutral-700 cursor-pointer">
                      Stack Trace (Geliştiriciler için)
                    </summary>
                    <pre className="text-xs text-neutral-600 bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Sayfayı Yenile
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500">
                Sorun devam ederse, lütfen hata detaylarını kopyalayıp destek ekibiyle paylaşın.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}