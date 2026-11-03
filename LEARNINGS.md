# Learnings

## Day 1
- **Decision: Supabase (Postgres) + Prisma.** Switched from an initial SQLite scaffold. Managed Postgres, real constraints, and a migration history reviewers can replay.
- **Decision: uniqueness in the database.** App-level checks race under concurrent requests; the unique index is the source of truth and the service only translates Prisma error `P2002` into a 409.
- **Decision: case-insensitive email without a functional index.** Prisma's schema can't express `lower(email)` indexes, so a `CHECK (email = lower(email))` in the migration forces lowercase and the normal `@unique` does the rest.
- **Decision: enable RLS on `students`.** Supabase exposes `public` tables via its REST API; Prisma doesn't turn RLS on for you.
- **Prisma 7 differences from older tutorials:** `provider = "prisma-client"` with a required `output`, no `url` in `schema.prisma` (it lives in `prisma.config.mjs`), and a driver adapter (`@prisma/adapter-pg`) is mandatory. Older blog posts mix v6 and v7 syntax.
- **Two connection strings:** the pooled one (6543) for the app, a direct/session one (5432) for migrations.
- **Decision: plain JavaScript, not TypeScript.** The brief does not require TS. Note that Prisma 7 still generates its client as TypeScript source into `src/generated/prisma` (git-ignored); our own code is all JS, with `jsconfig.json` providing the `@/` import alias.
- **Next.js 16 note:** dynamic route `params` is a Promise and must be awaited.
- **Decision: tests share the app database.** To make that safe, the storage tests never truncate; each run uses a unique email prefix and deletes only its own rows. Trade-off: they briefly write to real tables, and they advance the id sequence.
- **Not yet verified:** written without running `npm install`, `prisma generate`, `prisma migrate`, `npm test`, or `next build`. Likely first-run trouble spots: generated-client import paths (the schema sets `importFileExtension = "ts"`; adjust if Prisma complains), whether Prisma finds `prisma.config.mjs` (if not, pass `--config prisma.config.mjs` in the npm scripts), TLS to Supabase, and the hand-written init migration matching what Prisma would generate (check with `npx prisma migrate dev`; if it proposes a new migration, delete mine and use `--create-only` instead).

## Day 2
- **Search + filters use AND semantics.** Search is `contains` with `mode: "insensitive"` on name OR email, and status/course are exact filters combined with it in one query.
- **Dashboard from a grouped query.** One `groupBy` on status gives a consistent snapshot, so `total = active + inactive` by construction. After any change the UI refetches list and counts instead of patching local numbers, which avoids drift.
- **Out-of-order responses.** Typing fires several requests; each effect sets a `stale` flag on cleanup so only the latest response updates state. Search input is debounced (300 ms).
- **Prisma error codes.** `P2002` (unique) becomes a 409 and `P2025` (record not found) becomes a 404 on update/delete, so there is no extra read-before-write.
- **Delete confirmation** uses the native `<dialog>` element (focus trap and Esc come for free).
- **Route tests** call the exported handlers with real `Request` objects; this needs the `@` alias in `vitest.config.mjs`. Test files run one after another (`fileParallelism: false`) because they share a database.
- **Not yet verified:** like Day 1, none of this has been run. Watch for: `groupBy`/`distinct` behaviour with the pg adapter, `next/server` importing under Vitest, and the `<dialog>` focus behaviour in your browser.

_Add your own entries: wrong assumptions, abandoned approaches, bugs you hit._
