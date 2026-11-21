type PaginationProps = {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  /** Called when the pointer or focus reaches a button, to prefetch that page. */
  onIntent: (page: number) => void;
};

export const Pagination = ({ page, pages, onChange, onIntent }: PaginationProps) => (
  <nav className="pagination" aria-label="Pages">
    <button
      type="button"
      className="outline secondary"
      disabled={page <= 1}
      onClick={() => onChange(page - 1)}
      onMouseEnter={() => onIntent(page - 1)}
      onFocus={() => onIntent(page - 1)}
    >
      Previous
    </button>
    <small className="muted">
      Page {page} of {pages}
    </small>
    <button
      type="button"
      className="outline secondary"
      disabled={page >= pages}
      onClick={() => onChange(page + 1)}
      onMouseEnter={() => onIntent(page + 1)}
      onFocus={() => onIntent(page + 1)}
    >
      Next
    </button>
  </nav>
);
