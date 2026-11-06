"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { STATUSES } from "@/lib/constants";

const today = () => new Date().toISOString().slice(0, 10);

function Field({ name, label, error, children }) {
  const id = `f-${name}`;
  const errId = `${id}-err`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? errId : undefined })}
      {error && (
        <p id={errId} className="err">
          {error}
        </p>
      )}
    </div>
  );
}

/** Add form when `student` is null, edit form otherwise. The parent re-mounts it (via `key`) per student. */
export function StudentForm({ student, onSaved, onCancel }) {
  const editing = !!student;
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const formRef = useRef(null);

  // Move keyboard/screen-reader focus to the first field with an error.
  useEffect(() => {
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [errors]);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    const res = await api(editing ? `/api/students/${student.id}` : "/api/students", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    setSubmitting(false);
    if (res.ok) {
      if (!editing) form.reset();
      onSaved(res.data, editing ? "edit" : "create");
      return;
    }
    setErrors(res.error.fields ?? {});
    setFormError(res.error.fields ? null : res.error.message);
  }

  return (
    <section aria-labelledby="form-h" className="panel">
      <h2 id="form-h">{editing ? "Edit student" : "Add student"}</h2>
      <form ref={formRef} onSubmit={onSubmit} noValidate>
        <Field name="full_name" label="Full name" error={errors.full_name}>
          {(p) => <input {...p} name="full_name" autoComplete="name" defaultValue={student?.full_name} autoFocus={editing} />}
        </Field>
        <Field name="email" label="Email" error={errors.email}>
          {(p) => <input {...p} name="email" type="email" autoComplete="email" defaultValue={student?.email} />}
        </Field>
        <Field name="phone_number" label="Phone number" error={errors.phone_number}>
          {(p) => <input {...p} name="phone_number" type="tel" autoComplete="tel" defaultValue={student?.phone_number} />}
        </Field>
        <Field name="course" label="Course" error={errors.course}>
          {(p) => <input {...p} name="course" defaultValue={student?.course} />}
        </Field>
        <Field name="enrollment_date" label="Enrollment date" error={errors.enrollment_date}>
          {(p) => (
            <input {...p} name="enrollment_date" type="date" defaultValue={student?.enrollment_date ?? today()} suppressHydrationWarning />
          )}
        </Field>
        <Field name="status" label="Status" error={errors.status}>
          {(p) => (
            <select {...p} name="status" defaultValue={student?.status ?? "Active"}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
        </Field>

        {formError && (
          <p role="alert" className="banner bad">
            {formError}
          </p>
        )}
        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : editing ? "Save changes" : "Add student"}
          </button>
          {editing && (
            <button type="button" className="btn secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
