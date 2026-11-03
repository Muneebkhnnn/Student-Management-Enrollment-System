"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dashboard } from "./Dashboard";
import { Filters } from "./Filters";
import { StudentForm } from "./StudentForm";
import { StudentTable } from "./StudentTable";

const NO_FILTERS = { search: "", status: "", course: "" };

export function StudentsApp() {
  const [filters, setFilters] = useState(NO_FILTERS);
  const [search, setSearch] = useState(""); // debounced copy of filters.search
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // bump to reload list + counts after a change

  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Debounce typing so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  // Student list: reload when search/filters change or after a mutation.
  useEffect(() => {
    let stale = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (filters.status) qs.set("status", filters.status);
      if (filters.course) qs.set("course", filters.course);
      const res = await api(`/api/students?${qs}`);
      if (stale) return; // a newer request superseded this one
      if (res.ok) setStudents(res.data);
      else setLoadError(res.error.message);
      setLoading(false);
    })();
    return () => {
      stale = true;
    };
  }, [search, filters.status, filters.course, refreshKey]);

  // Dashboard counts and course list: reload after a mutation.
  useEffect(() => {
    let stale = false;
    (async () => {
      const res = await api("/api/dashboard");
      if (stale || !res.ok) return;
      setStats(res.data);
      // If the selected course no longer exists (e.g. its last student was deleted), drop the filter.
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

  const filtered = filters.search || filters.status || filters.course;

  return (
    <>
      <Dashboard stats={stats} />
      <div className="grid">
        <StudentForm key={editing?.id ?? "new"} student={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />

        <section aria-labelledby="list-h" className="panel">
          <h2 id="list-h">
            Students {!loading && !loadError && <span className="count">{students.length} shown</span>}
          </h2>
          <Filters filters={filters} courses={stats?.courses ?? []} onChange={setFilters} />

          {notice && (
            <p role="status" className="banner good">
              {notice}
            </p>
          )}
          {loading && <p role="status">Loading students…</p>}
          {loadError && (
            <p role="alert" className="banner bad">
              {loadError} <button className="link" onClick={refresh}>Try again</button>
            </p>
          )}
          {!loading && !loadError && students.length === 0 && (
            <p className="empty">
              {filtered ? "No students match your search or filters." : "No students yet. Add the first one using the form."}
              {filtered && (
                <>
                  {" "}
                  <button className="link" onClick={() => setFilters(NO_FILTERS)}>Clear filters</button>
                </>
              )}
            </p>
          )}
          {students.length > 0 && (
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
