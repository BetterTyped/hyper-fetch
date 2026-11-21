import type { ReactNode } from "react";
import { Component } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: (props: { error: unknown; reset: () => void }) => ReactNode;
};

type ErrorBoundaryState = { hasError: boolean; error: unknown };

/**
 * React has no hook for error boundaries, so this is the usual small class component.
 * `throwOnError` throws the typed error object, so `error` is not always an `Error` instance.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return this.props.fallback({ error: this.state.error, reset: this.reset });
    }
    return this.props.children;
  }
}
