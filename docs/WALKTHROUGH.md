# Walkthrough script (aim for 5–8 minutes)

Record your screen with a narrator voice. Use this as a checklist, and run the whole flow once before recording. Anything that fails goes into `LEARNINGS.md`.

1. **0:00 Intro (30s).** What it is, stack: Next.js 16.4.4 (JS), Supabase Postgres, Prisma, Zod, Vitest. Mention which AI tools you used and for what.
2. **0:30 Architecture (1m).** Show the folder layout: `src/app/api` (routes), `src/lib` (validation, students, db), `src/components`, `prisma/`, `tests/`. Explain the flow form → route → Zod → Prisma → Postgres.
3. **1:30 Database (1m).** Show `schema.prisma` and the migration. Explain duplicate-email protection: unique index + lowercase CHECK + app normalization; why the DB is the source of truth; RLS.
4. **2:30 Demo (2m).**
   - Add a student. Add the same email in a different case: duplicate error appears under the email field.
   - Submit an empty/invalid form: errors and focus on the first bad field.
   - Edit a student, save. Delete one: confirmation dialog, then the counts change.
   - Search by name, then by email part. Filter by status and course together. Clear filters.
   - Change sort, change page size, move between pages. Show the empty state.
   - Optional: stop the dev server, trigger an action, show the network error message.
5. **4:30 Tests (1m).** Run `npm test`. Explain what is covered (validation, duplicates at both levels, update/delete, search/filter, paging/sort, HTTP codes) and what is not (UI tests, concurrency).
6. **5:30 What failed (1m).** Your real biggest problem, what you tried, how you fixed it. Be specific.
7. **6:30 Next steps (1m).** Version column for conflicts, courses table, UI tests, seed data, deployment. Name the known limitations honestly.

## Be ready for the live review
Likely change requests: add a field (e.g. `city`), change a validation rule, add a filter, change the default sort, soft delete. Know where each lives: schema + migration, `validation.js`, `students.js`, the route, and the form component.
