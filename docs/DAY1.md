# Day 1: requirements, design, plan

## Requirements in my own words
Ops staff need one place to register students across courses, keep records correct (no duplicate emails, no junk input), and see enrollment status at a glance. Rules live on the server; the browser only helps.

## Open questions for the hiring team
1. Is the course list fixed, or free text?
2. Should deleting a student be permanent or a soft delete?
3. Can two students share a phone number?
4. Who uses this (roles/auth), and roughly how many records?

## Assumptions
See README "Assumptions".

## Data model
`students(id, full_name, email UNIQUE, phone_number, course, enrollment_date, status, created_at, updated_at)` in Supabase Postgres, managed with Prisma.
Duplicates are prevented by a unique index on `email`, plus a CHECK that email is lowercase and lowercase normalization in the app.

## Plan
- **Day 2:** PUT/DELETE endpoints, edit form + delete confirmation, search (name/email), filters (status/course), dashboard counts via `groupBy`/`count`, route-level tests.
- **Day 3:** edge cases, responsive/a11y polish, pagination/sorting, API docs, report, walkthrough.

## Day 1 check-in (fill in)
- Completed: scaffold, schema + migration, validation, POST/GET API, create+list UI, initial tests
- Not completed: update/delete/search/filter/dashboard (Day 2)
- Biggest issue / how handled: [fill in]
- Unsure about: course as free text vs table
- Clarification needed: questions above
- Actual hours: [fill in]
- Plan for tomorrow: Day 2 list above
