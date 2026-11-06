# Day 3: reliability, usability, explainability

## Change notice
_Paste the hiring team's Day 3 constraint/change here, its impact, and what you adjusted. If none was sent, say so._

## Done
- Pagination (page, pageSize up to 50) and sorting (five fields, either direction) with stable ordering; page-size selector; "Showing a–b of N".
- Edge cases: page past the end, vanished course filter, date range, delete of an open/already-deleted record, double submits.
- Usability/accessibility: loading dimming, always-present status region, focus on first invalid field, labelled controls, responsive layout, error page.
- Tests extended (pagination, sorting, bad paging/sort parameters, date range).
- Docs: README (troubleshooting), `docs/API.md`, `docs/REPORT.md`, `docs/WALKTHROUGH.md`, `LEARNINGS.md`.

## Final check-in (fill in)
- Completed: [..]
- Not completed, and why: UI automated tests, optimistic concurrency (kept scope small)
- Biggest issue / how handled: [..]
- Unsure about: exact-match course filter; hard vs soft delete
- Clarification needed: [..]
- Actual hours: [..]
- Next (with two more days): see report section 6
