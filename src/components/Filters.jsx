import { STATUSES } from "@/lib/constants";

export function Filters({ filters, courses, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = filters.search || filters.status || filters.course;
  return (
    <form role="search" className="filters" onSubmit={(e) => e.preventDefault()}>
      <div className="field grow">
        <label htmlFor="q">Search name or email</label>
        <input id="q" type="search" value={filters.search} onChange={set("search")} placeholder="e.g. asha or @example.com" />
      </div>
      <div className="field">
        <label htmlFor="fs">Status</label>
        <select id="fs" value={filters.status} onChange={set("status")}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="fc">Course</label>
        <select id="fc" value={filters.course} onChange={set("course")}>
          <option value="">All</option>
          {courses.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {active && (
        <button type="button" className="btn secondary" onClick={() => onChange({ search: "", status: "", course: "" })}>
          Clear
        </button>
      )}
    </form>
  );
}
