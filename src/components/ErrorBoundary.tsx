import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Error desconocido' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error en ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      localStorage.removeItem('sotex_service_reports_v1');
      localStorage.removeItem('sotex_service_reports_v2');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl max-w-lg shadow-2xl">
            <div className="w-12 h-12 bg-red-900/50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-700">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Se detectó un inconveniente al cargar el panel
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {this.state.errorMessage || 'Error inesperado al inicializar componentes.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
            >
              Restablecer Datos Demo y Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
