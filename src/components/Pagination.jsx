import { PAGE_SIZES } from "@/lib/constants";

export function Pagination({ page, pageSize, total, totalPages, onPage, onPageSize }) {
  if (total === 0) return null;
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);
  return (
    <nav className="pager" aria-label="Pagination">
      <p className="muted" aria-live="polite">
        Showing {from}–{to} of {total}
      </p>
      <div className="pager-controls">
        <label htmlFor="ps" className="sr-only">
          Rows per page
        </label>
        <select id="ps" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
        <button type="button" className="btn secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" className="btn secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}
