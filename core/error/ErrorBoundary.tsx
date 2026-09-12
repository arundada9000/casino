"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/core/logging/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error("error-boundary", "Uncaught render error", { error, info });
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error && this.props.fallback) {
      return this.props.fallback;
    }
    if (this.state.error) {
      return (
        <div role="alert" style={{ padding: "2rem", fontFamily: "system-ui" }}>
          <p>Something went wrong.</p>
          <button type="button" onClick={this.reset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}