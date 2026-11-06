# API reference

Base URL (local): `http://localhost:3000`. JSON in, JSON out. Success bodies are `{ "data": ... }`.
Errors always look like:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields need attention.", "fields": { "email": "Enter a valid email address" } } }
```

## Student object
```json
{
  "id": 1, "full_name": "Asha Verma", "email": "asha@example.com", "phone_number": "+91 98765 43210",
  "course": "Data Analytics", "enrollment_date": "2026-11-03", "status": "Active",
  "created_at": "2026-11-03T09:30:00.000Z", "updated_at": "2026-11-03T09:30:00.000Z"
}
```
Rules: `full_name` required (max 120); `email` required, valid, unique (case-insensitive, stored lowercase); `phone_number` 7–15 digits, optional leading `+`; `course` required (max 120); `enrollment_date` real date `YYYY-MM-DD` between 1900 and 2100; `status` `Active` or `Inactive` (default `Active`).

## Endpoints

### POST /api/students
Create. Returns `201` with the student and a `Location` header.
Errors: `400 INVALID_JSON`, `422 VALIDATION_ERROR` (with `fields`), `409 DUPLICATE_EMAIL` (with `fields.email`).

### GET /api/students
List with search, filters, sorting, and paging.

| Query | Meaning | Default |
|---|---|---|
| `search` | Case-insensitive substring of name or email | none |
| `status` | `Active` or `Inactive` | none |
| `course` | Exact course name | none |
| `sort` | `created_at`, `full_name`, `course`, `enrollment_date`, `status` | `created_at` |
| `order` | `asc` or `desc` | `desc` |
| `page` | 1 or more | `1` |
| `pageSize` | 1–50 | `10` |

```json
{ "data": [ /* students */ ], "meta": { "total": 23, "page": 2, "pageSize": 10, "totalPages": 3 } }
```
A page past the end returns `data: []` with the real `meta`. Errors: `400 INVALID_QUERY` (with `fields`).

### GET /api/students/:id
Returns one student. Errors: `400 INVALID_ID`, `404 NOT_FOUND`.

### PUT /api/students/:id
Replace a student; body is the same as create. Returns `200`. Errors: `400 INVALID_ID`, `400 INVALID_JSON`, `404 NOT_FOUND`, `409 DUPLICATE_EMAIL`, `422 VALIDATION_ERROR`.

### DELETE /api/students/:id
Permanent delete. Returns `204` with no body. Errors: `400 INVALID_ID`, `404 NOT_FOUND`.

### GET /api/dashboard
```json
{ "data": { "total": 23, "active": 18, "inactive": 5, "courses": ["Data Analytics", "Design"] } }
```
Counts are computed from the stored rows on every request.

## Status codes
`200` ok, `201` created, `204` deleted, `400` bad request/query/id, `404` not found, `409` duplicate email, `422` validation failed, `500` unexpected server error (`INTERNAL_ERROR`).

## Examples
```bash
curl -X POST localhost:3000/api/students -H 'Content-Type: application/json' \
  -d '{"full_name":"Asha Verma","email":"asha@example.com","phone_number":"+91 98765 43210","course":"Data Analytics","enrollment_date":"2026-11-03"}'

curl 'localhost:3000/api/students?status=Active&sort=full_name&order=asc&page=1&pageSize=10'
curl -X PUT localhost:3000/api/students/1 -H 'Content-Type: application/json' -d '{ ...full student body... }'
curl -X DELETE localhost:3000/api/students/1
curl localhost:3000/api/dashboard
```
