// HTTP-level tests: call the Next.js route handlers directly with real Request objects.
// Same shared-database rules as students.test.js (unique prefix, only own rows deleted).
import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { GET as dashboardGET } from "../src/app/api/dashboard/route.js";
import { GET as listGET, POST } from "../src/app/api/students/route.js";
import { DELETE, GET as getOne, PUT } from "../src/app/api/students/[id]/route.js";
import { getDb } from "../src/lib/db";
import { makeRun } from "./helpers";

const { runId, prefix, email, valid } = makeRun();

const req = (method, body, path = "/api/students") =>
  new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
const ctx = (id) => ({ params: Promise.resolve({ id: String(id) }) });
const create = async (n, extra) => (await (await POST(req("POST", valid(n, extra)))).json()).data;

beforeAll(() => {
  if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in .env and run `npm run db:deploy` first.");
});

afterEach(async () => {
  await getDb().student.deleteMany({ where: { email: { startsWith: prefix } } });
});

afterAll(async () => {
  await getDb().$disconnect();
});

describe("POST /api/students", () => {
  it("creates a student: 201 + Location", async () => {
    const res = await POST(req("POST", valid(1)));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data).toMatchObject({ email: email(1), status: "Active" });
    expect(res.headers.get("Location")).toBe(`/api/students/${json.data.id}`);
  });

  it("returns 422 with per-field errors for invalid input", async () => {
    const res = await POST(req("POST", { ...valid(1), email: "nope", phone_number: "abc", full_name: "  " }));
    const json = await res.json();
    expect(res.status).toBe(422);
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(json.error.fields)).toEqual(expect.arrayContaining(["email", "phone_number", "full_name"]));
  });

  it("returns 400 for a body that is not JSON", async () => {
    const res = await POST(req("POST", "{nope"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_JSON");
  });

  it("returns 409 for a duplicate email (any case)", async () => {
    await create(1);
    const res = await POST(req("POST", { ...valid(1), email: email(1).toUpperCase() }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe("DUPLICATE_EMAIL");
    expect(json.error.fields.email).toBeTruthy();
  });
});

describe("GET /api/students and /api/students/:id", () => {
  it("gets one student, 404 for missing, 400 for a bad id", async () => {
    const s = await create(1);
    expect((await getOne(req("GET"), ctx(s.id))).status).toBe(200);
    expect((await getOne(req("GET"), ctx(2_147_483_647))).status).toBe(404);
    expect((await getOne(req("GET"), ctx("abc"))).status).toBe(400);
  });

  it("searches and filters through query parameters", async () => {
    const course = `Course-${runId}`;
    await create(1, { full_name: `Findme ${runId} Alpha`, course });
    await create(2, { full_name: `Findme ${runId} Beta`, course, status: "Inactive" });
    const list = async (qs) => (await (await listGET(req("GET", undefined, `/api/students?${qs}`))).json()).data;

    expect((await list(`course=${encodeURIComponent(course)}`)).length).toBe(2);
    expect((await list(`course=${encodeURIComponent(course)}&status=Inactive`)).map((s) => s.email)).toEqual([email(2)]);
    expect((await list(`course=${encodeURIComponent(course)}&search=alpha`)).map((s) => s.email)).toEqual([email(1)]);
  });

  it("returns 400 for an invalid status filter", async () => {
    const res = await listGET(req("GET", undefined, "/api/students?status=Pending"));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_QUERY");
  });
});

describe("PUT /api/students/:id", () => {
  it("updates a student", async () => {
    const s = await create(1);
    const res = await PUT(req("PUT", valid(1, { full_name: "Changed", status: "Inactive" })), ctx(s.id));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toMatchObject({ id: s.id, full_name: "Changed", status: "Inactive" });
  });

  it("returns 404 for a missing student, 422 for invalid input, 409 for a duplicate email", async () => {
    const a = await create(1);
    const b = await create(2);
    expect((await PUT(req("PUT", valid(1)), ctx(2_147_483_647))).status).toBe(404);
    expect((await PUT(req("PUT", { ...valid(1), email: "nope" }), ctx(a.id))).status).toBe(422);
    expect((await PUT(req("PUT", valid(1)), ctx(b.id))).status).toBe(409);
  });
});

describe("DELETE /api/students/:id", () => {
  it("deletes (204), then the student is gone (404)", async () => {
    const s = await create(1);
    expect((await DELETE(req("DELETE"), ctx(s.id))).status).toBe(204);
    expect((await getOne(req("GET"), ctx(s.id))).status).toBe(404);
    expect((await DELETE(req("DELETE"), ctx(s.id))).status).toBe(404);
  });
});

describe("GET /api/dashboard", () => {
  it("returns counts and courses from stored rows", async () => {
    const course = `Course-${runId}`;
    await create(1, { course, status: "Inactive" });
    const res = await dashboardGET();
    const { data } = await res.json();
    expect(res.status).toBe(200);
    expect(data.total).toBe(data.active + data.inactive);
    expect(data.inactive).toBeGreaterThanOrEqual(1);
    expect(data.courses).toContain(course);
  });
});
