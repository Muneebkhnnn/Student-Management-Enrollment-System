# Short report: Student Management & Enrollment System

*(Draft written with AI assistance. Replace every [bracketed] item with your real results, and edit anything that is not true for your run. Keep it to 3 pages when exported.)*

## 1. Problem and assumptions
An operations team needs an internal tool to register students, keep records accurate, search and filter them, and see enrollment status at a glance. I treated data integrity as the main risk: rules are enforced on the server and in the database, and the browser only gives early feedback.
Assumptions: course is free text; `status` defaults to Active; phone numbers are 7–15 digits with an optional `+`; dates are plain `YYYY-MM-DD` between 1900 and 2100; update is a full replacement; delete is permanent; no authentication (internal tool). Open questions I sent: [list the answers you got, or "no reply"].

## 2. Architecture and approach
- **Frontend:** Next.js 16.4.4 App Router, plain JavaScript. A client component loads data through `/api/*`, with small components for the form, filters, table, pagination, and a delete confirmation dialog. No hard-coded records.
- **Backend:** Next.js route handlers. Input is validated with Zod; every error uses one shape `{ error: { code, message, fields? } }` with proper status codes (400/404/409/422).
- **Database:** Supabase Postgres through Prisma 7. Unique index on `email`, plus `CHECK (email = lower(email))` so uniqueness is effectively case-insensitive. CHECK constraints for blank fields, a Postgres enum for status, and Row Level Security enabled so Supabase's public REST API cannot touch the table.
- **Flow:** form → `POST/PUT` → Zod → Prisma → Postgres. A unique violation (Prisma `P2002`) is translated into `409 DUPLICATE_EMAIL`, so concurrent requests are safe. The list, counts, and course dropdown are always read from the database.

## 3. Trade-offs
- **Postgres/Prisma vs SQLite:** chosen for real constraints and a replayable migration history; costs setup (two connection strings).
- **DB-level uniqueness vs check-then-insert:** a pre-check races under concurrent requests, so the database decides and the app translates the error.
- **Sort `<select>` vs clickable headers:** less code and works on phones and keyboards.
- **Refetch after changes vs patching local state:** a little more traffic, but the counts and list can never drift from the database.
- **Skipped:** optimistic concurrency (last write wins), soft delete, authentication, UI automated tests.

## 4. Testing and results
Automated (Vitest, [N] tests): validation rules; create/read; duplicate email at app and database level; update (including keeping your own email and clashing with another); delete; search; status/course filters; pagination without overlap; sorting; dashboard counts; and HTTP status codes/error shapes by calling the route handlers directly. Tests share the app database safely: unique email prefix per run, only their own rows deleted.
Result of my last run: [X passed / Y failed; paste the summary line].
Manually checked: [list: add, duplicate email, edit, delete confirm, search, filters, pagination, empty state, offline error, mobile width].
Not tested: UI components automatically, concurrent edits, search with `%`/`_`, behaviour on a slow network, TLS certificate verification.

## 5. Failures and learning
Summary of `LEARNINGS.md`. Most important issue resolved: [describe your real biggest bug, what you tried, and the fix]. Other lessons: Prisma 7 changed setup (adapter, config file, generator output); pagination needs a stable tie-breaker sort; Supabase tables need RLS turned on explicitly.

## 6. Limitations and next steps
Limitations: last-write-wins edits; the database connection encrypts but does not verify the certificate; no authentication or audit trail; sort order follows database collation; no seed data.
With two more days: version column for conflict detection, a courses table, header-click sorting, UI tests (Playwright), CSV import/export, seed script, deployment with CI running tests.

## 7. How to run
```bash
npm install
cp .env.example .env     # fill DATABASE_URL and DIRECT_URL from Supabase
npm run db:deploy        # create tables
npm run dev              # http://localhost:3000
npm test
```
Details and troubleshooting: `README.md`.
