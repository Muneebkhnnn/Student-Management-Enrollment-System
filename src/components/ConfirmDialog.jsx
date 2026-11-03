"use client";

import { useEffect, useRef } from "react";

/** Native <dialog>: focus is trapped, Esc closes it, and the page behind is inert. */
export function ConfirmDialog({ open, title, children, confirmLabel, busy, error, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onCancel} aria-labelledby="dlg-title" className="dialog">
      <h2 id="dlg-title">{title}</h2>
      <div>{children}</div>
      {error && (
        <p role="alert" className="banner bad">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <button type="button" className="btn secondary" onClick={onCancel} autoFocus>
          Cancel
        </button>
        <button type="button" className="btn danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
