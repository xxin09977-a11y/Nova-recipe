/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  featureName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group(`[KitchenOS Security] Feature Failure: ${this.props.featureName}`);
    console.error('Error Trace:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full glass-dark border border-red-500/10 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="absolute -inset-4 bg-red-500/5 blur-2xl rounded-full -z-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">
              Feature Unavailable
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Protocol: {this.props.featureName.toUpperCase()} • Status: TERMINATED
            </p>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs font-medium">
            The local node encountered a critical exception during sequence execution. 
            Diagnostic data has been logged to the core console.
          </p>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-white/5 text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Re-initialize Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
