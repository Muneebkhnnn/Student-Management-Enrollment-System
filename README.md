# Student Management & Enrollment System

Internal tool for registering students and keeping enrollment records accurate.
Built for the EduRankAI 3-day full-stack challenge. **Status: Day 3 (final).**

## Features
- Create, view, edit, and delete students (delete asks for confirmation).
- Student list with loading, empty, and error states.
- Search by name or email, filter by status and course (filters combine with search).
- Sorting (name, enrollment date, course, status, date added) and pagination (10/25/50 per page).
- Dashboard with total / active / inactive counts computed from the stored rows.
- Server-side validation, unique email handling, and consistent JSON errors.

## Stack
- Next.js 16.4.4 (App Router, JavaScript), React 19.3
- Supabase (Postgres) accessed with Prisma 7 and the `@prisma/adapter-pg` driver adapter
- Zod for server-side validation, Vitest for tests

## Prerequisites
Node.js 20.9+ (22 LTS recommended), npm, and a Supabase project.

## Setup and run
1. `npm install` (also runs `prisma generate`).
2. `cp .env.example .env` (Windows: `copy .env.example .env`) and fill in the connection strings.
3. `npm run db:deploy` to create the tables.
4. `npm run dev` then open http://localhost:3000.

Production: `npm run build && npm start`.

## Tests
`npm test` runs everything. Validation tests need no database. Storage and API tests run against the same database as the app (`DATABASE_URL`, or `TEST_DATABASE_URL` if set). They never truncate: each run uses a unique email prefix and deletes only its own rows afterwards.
- `tests/validation.test.js`: field rules.
- `tests/students.test.js`: create, duplicate email (app and database level), update, delete, search, filters, pagination, sorting, dashboard counts.
- `tests/api.test.js`: route handlers called with real `Request` objects (status codes, error shapes).

## Environment variables
| Name | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | app at runtime | Supabase **Transaction pooler** string (port 6543). Don't add `sslmode`. |
| `DIRECT_URL` | Prisma CLI | Supabase **Direct** or **Session pooler** string (port 5432) for migrations. |
| `TEST_DATABASE_URL` | tests (optional) | Database for storage/API tests. Defaults to `DATABASE_URL`. |

Get the strings from the Supabase dashboard's **Connect** panel. Never commit `.env`.

## Database
One table, `students`, defined in `prisma/schema.prisma`; migration in `prisma/migrations/`.
- `email` has a `UNIQUE` index, and a `CHECK (email = lower(email))` forces lowercase, so uniqueness is effectively case-insensitive and enforced by Postgres even if app code is bypassed. The app also trims and lowercases emails before saving.
- `CHECK` constraints reject blank name, phone, and course. `status` is a Postgres enum (`Active`/`Inactive`). `enrollment_date` is a `DATE`.
- Row Level Security is enabled with no policies, so Supabase's public REST API cannot read or write the table. The app connects as `postgres`, which bypasses RLS.
- Extra columns: `created_at`, `updated_at`.

## API
Full request/response examples are in [`docs/API.md`](docs/API.md).

All errors look like `{ "error": { "code", "message", "fields"? } }`. Success bodies are `{ "data": ... }`.

| Method | Path | Purpose | Success | Errors |
|---|---|---|---|---|
| POST | `/api/students` | Create a student | 201 + `Location` | 400 `INVALID_JSON`, 422 `VALIDATION_ERROR`, 409 `DUPLICATE_EMAIL` |
| GET | `/api/students` | List students. Optional `search`, `status`, `course`, `page`, `pageSize` (1–50), `sort`, `order`. Returns `{ data, meta }` | 200 | 400 `INVALID_QUERY` |
| GET | `/api/students/:id` | Get one student | 200 | 400 `INVALID_ID`, 404 `NOT_FOUND` |
| PUT | `/api/students/:id` | Replace a student (same body as create) | 200 | 400, 404, 409, 422 |
| DELETE | `/api/students/:id` | Delete a student (permanent) | 204 | 400, 404 |
| GET | `/api/dashboard` | `{ total, active, inactive, courses[] }` | 200 | 500 |

Examples:
```bash
curl -X POST localhost:3000/api/students -H 'Content-Type: application/json' \
  -d '{"full_name":"Asha Verma","email":"asha@example.com","phone_number":"+91 98765 43210","course":"Data Analytics","enrollment_date":"2026-11-03"}'

curl 'localhost:3000/api/students?search=asha&status=Active&course=Data%20Analytics'
curl -X DELETE localhost:3000/api/students/1
```

## Assumptions
- `status` defaults to `Active` when omitted.
- `course` is free text, and the course filter is an exact match (so "Design" and "design" are different courses).
- Search is a case-insensitive substring match on name or email.
- Update is a full replacement (PUT); delete is permanent (no soft delete).
- Default order is newest added first; page size defaults to 10 (max 50). Enrollment dates must be between 1900 and 2100.
- Phone: optional leading `+`, digits, spaces, `-`, `()`; 7–15 digits.
- Dates are plain `YYYY-MM-DD` (no time zone).
- No authentication; this is an internal tool.

## Known limitations
- Sorting uses the database collation for text, so case/accents may order differently than a human expects.
- Search passes the typed text to Postgres `ILIKE`-style matching through Prisma; behaviour with `%` and `_` in the search box has not been tested.
- No authentication, no audit trail, no bulk import/export, and no seed data.
- The DB connection encrypts with TLS but does not verify the server certificate (`rejectUnauthorized: false` in `src/lib/db.js`). For production, supply Supabase's CA certificate and turn verification on.
- Two people editing the same student: last write wins (no version check).
- The UI has no automated tests; it was checked by hand only.

## Troubleshooting
- **P1001 / can't reach database:** use the Session pooler string for `DIRECT_URL` and check password URL-encoding.
- **TLS / self-signed certificate errors:** remove any `sslmode` from `DATABASE_URL`.
- **Prisma can't find a datasource URL:** add `--config prisma.config.mjs` to the npm scripts that call `prisma`.
- **Tests fail with "Set DATABASE_URL":** create `.env` first and run `npm run db:deploy`.

## Project docs
`docs/API.md` (endpoints), `docs/REPORT.md` (short report), `docs/WALKTHROUGH.md` (demo script), `docs/DAY1.md`–`DAY3.md` (daily notes and check-ins), `LEARNINGS.md`.

## AI assistance disclosure
Claude was used as part of development of this project
