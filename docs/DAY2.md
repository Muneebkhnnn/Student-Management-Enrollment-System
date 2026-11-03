# Day 2: core workflow

## Change notice
_Paste the hiring team's Day 2 requirement/clarification here, what it changes, and what you did about it. If none was sent, say so._

## Done
- PUT and DELETE endpoints (404 for missing records, 409 for duplicate email on update).
- Search (name/email) and status/course filters, validated server-side (400 on bad filters).
- `/api/dashboard` counts from stored data; the UI refreshes them after every change.
- UI: add/edit form, delete confirmation dialog, filters, dashboard cards, empty/loading/error states.
- Tests: update, delete, search/filters, dashboard, and HTTP route tests.

## Plan for Day 3
Edge-case review, responsive/accessibility pass, pagination and sorting, API docs polish, report (max 3 pages), walkthrough.

## Day 2 check-in (fill in)
- Completed: full CRUD, search, filters, dashboard, validation/error handling, tests
- Not completed: pagination/sorting (Day 3); automated UI tests
- Biggest issue / how handled: [fill in]
- Unsure about: exact-match course filter; hard delete vs soft delete
- Clarification needed: [fill in]
- Actual hours: [fill in]
- Plan for tomorrow: see Plan for Day 3
