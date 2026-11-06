"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dashboard } from "./Dashboard";
import { Filters } from "./Filters";
import { Pagination } from "./Pagination";
import { StudentForm } from "./StudentForm";
import { StudentTable } from "./StudentTable";

const DEFAULT_FILTERS = { search: "", status: "", course: "", sort: "created_at:desc" };
const hasFilter = (f) => !!(f.search || f.status || f.course);

export function StudentsApp() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState(""); // debounced copy of filters.search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // bump to reload list + counts after a change

  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Any change to search/filter/sort goes back to page 1.
  function changeFilters(next) {
    setFilters(next);
    setPage(1);
  }

  // Debounce typing so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  // Student list: reload when search/filters/sort/page change or after a mutation.
  useEffect(() => {
    let stale = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const [sort, order] = filters.sort.split(":");
      const qs = new URLSearchParams({ page, pageSize, sort, order });
      if (search) qs.set("search", search);
      if (filters.status) qs.set("status", filters.status);
      if (filters.course) qs.set("course", filters.course);
      const res = await api(`/api/students?${qs}`);
      if (stale) return; // a newer request superseded this one
      if (!res.ok) {
        setLoadError(res.error.message);
      } else if (res.meta.totalPages > 0 && page > res.meta.totalPages) {
        setPage(res.meta.totalPages); // e.g. the last row of the last page was deleted; refetches
        return;
      } else {
        setStudents(res.data);
        setMeta(res.meta);
      }
      setLoading(false);
    })();
    return () => {
      stale = true;
    };
  }, [search, filters.status, filters.course, filters.sort, page, pageSize, refreshKey]);

  // Dashboard counts and course list: reload after a mutation.
  useEffect(() => {
    let stale = false;
    (async () => {
      const res = await api("/api/dashboard");
      if (stale || !res.ok) return;
      setStats(res.data);
      // If the selected course no longer exists (its last student was deleted), drop the filter.
      setFilters((f) => (f.course && !res.data.courses.includes(f.course) ? { ...f, course: "" } : f));
    })();
    return () => {
      stale = true;
    };
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  function onSaved(student, mode) {
    setNotice(`${mode === "edit" ? "Updated" : "Added"} ${student.full_name}.`);
    if (mode === "edit") setEditing(null);
    else setPage(1);
    refresh();
  }

  function closeDelete() {
    setToDelete(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await api(`/api/students/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok || res.error.code === "NOT_FOUND") {
      setNotice(res.ok ? `Deleted ${toDelete.full_name}.` : `${toDelete.full_name} was already deleted.`);
      if (editing?.id === toDelete.id) setEditing(null);
      closeDelete();
      refresh();
    } else {
      setDeleteError(res.error.message);
    }
  }

  const filtered = hasFilter(filters);

  return (
    <>
      <Dashboard stats={stats} />
      <div className="grid">
        <StudentForm key={editing?.id ?? "new"} student={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />

        <section aria-labelledby="list-h" className="panel">
          <h2 id="list-h">
            Students {meta && !loadError && <span className="count">{meta.total} {filtered ? "matching" : "total"}</span>}
          </h2>
          <Filters filters={filters} courses={stats?.courses ?? []} onChange={changeFilters} />

          {/* Always rendered so screen readers announce changes to it. */}
          <div role="status" aria-live="polite">
            {notice && <p className="banner good">{notice}</p>}
          </div>
          {loading && students.length === 0 && <p>Loading students…</p>}
          {loadError && (
            <p role="alert" className="banner bad">
              {loadError} <button className="link" onClick={refresh}>Try again</button>
            </p>
          )}
          {!loading && !loadError && meta?.total === 0 && (
            <p className="empty">
              {filtered ? "No students match your search or filters." : "No students yet. Add the first one using the form."}
              {filtered && (
                <>
                  {" "}
                  <button className="link" onClick={() => changeFilters({ ...filters, search: "", status: "", course: "" })}>
                    Clear filters
                  </button>
                </>
              )}
            </p>
          )}
          <div aria-busy={loading} className={loading && students.length > 0 ? "dim" : undefined}>
            {students.length > 0 && !loadError && (
              <StudentTable
                students={students}
                editingId={editing?.id}
                onEdit={(s) => {
                  setNotice(null);
                  setEditing(s);
                }}
                onDelete={setToDelete}
              />
            )}
          </div>
          {meta && !loadError && (
            <Pagination {...meta} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete student?"
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeDelete}
      >
        <p>
          {toDelete?.full_name} ({toDelete?.email}) will be permanently removed. This can&rsquo;t be undone.
        </p>
      </ConfirmDialog>
    </>
  );
}
