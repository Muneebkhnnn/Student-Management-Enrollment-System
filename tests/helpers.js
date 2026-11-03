/** Unique-per-run test data, so tests can share the app database and clean up only their own rows. */
export function makeRun() {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const prefix = `test-${runId}-`;
  const email = (n) => `${prefix}${n}@example.com`;
  const valid = (n, extra = {}) => ({
    full_name: "Asha Verma",
    email: email(n),
    phone_number: "+91 98765 43210",
    course: "Data Analytics",
    enrollment_date: "2026-11-03",
    status: "Active",
    ...extra,
  });
  return { runId, prefix, email, valid };
}
