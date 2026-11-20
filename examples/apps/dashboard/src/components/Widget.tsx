import type { ReactNode } from "react";

type WidgetProps = {
  title: string;
  loading: boolean;
  error: { message: string } | null;
  onRetry: () => void;
  updatedAt: Date | null;
  children: ReactNode;
};

/**
 * Every widget handles its own loading and error state. A failing request breaks one card, never the page.
 * With data from an earlier response, the error shows under that data instead of replacing it.
 */
export const Widget = ({ title, loading, error, onRetry, updatedAt, children }: WidgetProps) => (
  <article className="widget">
    <header>
      <small className="muted">{title}</small>
    </header>
    {loading && !updatedAt ? <p aria-busy="true" /> : children}
    {error && (
      <p className="error">
        {error.message}{" "}
        <button type="button" className="outline secondary" onClick={onRetry}>
          Retry
        </button>
      </p>
    )}
    {updatedAt && (
      <footer>
        <small className="muted">Last checked {updatedAt.toLocaleTimeString()}</small>
      </footer>
    )}
  </article>
);
