// Service-layer integration tests against a real Postgres (DATABASE_URL, or TEST_DATABASE_URL if set).
// They never truncate: each run uses a unique email prefix and deletes only its own rows.
import "dotenv/config";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createPrisma } from "../src/lib/db";
import {
  DuplicateEmailError,
  createStudent,
  deleteStudent,
  getDashboard,
  getStudent,
  listStudents,
  updateStudent,
} from "../src/lib/students";
import { studentSchema } from "../src/lib/validation";
import { makeRun } from "./helpers";

const { runId, prefix, email, valid } = makeRun();
const parse = (n, extra) => studentSchema.parse(valid(n, extra));
const make = (n, extra) => createStudent(db, parse(n, extra));
const emails = (result) => result.items.map((s) => s.email).sort();

const rawRow = (e) => ({
  full_name: "A",
  email: e,
  phone_number: "1234567",
  course: "X",
  enrollment_date: new Date("2026-01-01T00:00:00.000Z"),
});

let db;

beforeAll(() => {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL (or TEST_DATABASE_URL) in .env and run `npm run db:deploy` first.");
  db = createPrisma(url);
});

afterEach(async () => {
  await db.student.deleteMany({ where: { email: { startsWith: prefix } } });
});

afterAll(async () => {
  await db?.$disconnect();
});

describe("create and read", () => {
  it("creates a student and reads it back", async () => {
    const created = await make(1);
    expect(created.id).toBeGreaterThan(0);
    expect(created.enrollment_date).toBe("2026-11-03");
    expect(await getStudent(db, created.id)).toMatchObject({ full_name: "Asha Verma", email: email(1) });
    expect((await listStudents(db, { search: prefix })).items.map((s) => s.id)).toContain(created.id);
  });

  it("returns undefined for a missing student", async () => {
    expect(await getStudent(db, 2_147_483_647)).toBeUndefined();
  });

  it("lists newest first", async () => {
    const a = await make(3);
    const b = await make(4);
    const ids = (await listStudents(db, { search: prefix })).items.map((s) => s.id);
    expect(ids.indexOf(b.id)).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf(b.id)).toBeLessThan(ids.indexOf(a.id));
  });
});

describe("duplicate emails", () => {
  it("rejects a duplicate email, ignoring case", async () => {
    await make(1);
    const again = studentSchema.parse({ ...valid(1), full_name: "Other", email: email(1).toUpperCase() });
    await expect(createStudent(db, again)).rejects.toBeInstanceOf(DuplicateEmailError);
    expect(await db.student.count({ where: { email: email(1) } })).toBe(1);
  });

  it("enforces email uniqueness in the database itself", async () => {
    await db.student.create({ data: rawRow(email(2)) });
    await expect(db.student.create({ data: rawRow(email(2)) })).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects a non-lowercase email at the database level", async () => {
    await expect(db.student.create({ data: rawRow(`Mixed-${runId}@Example.com`) })).rejects.toThrow();
  });
});

describe("update", () => {
  it("updates a student and persists the change", async () => {
    const s = await make(1);
    const updated = await updateStudent(db, s.id, parse(1, { full_name: "Asha V.", status: "Inactive", course: "Design" }));
    expect(updated).toMatchObject({ id: s.id, full_name: "Asha V.", status: "Inactive", course: "Design" });
    expect(await getStudent(db, s.id)).toMatchObject({ full_name: "Asha V.", status: "Inactive" });
  });

  it("allows a student to keep their own email", async () => {
    const s = await make(1);
    expect(await updateStudent(db, s.id, parse(1, { course: "Design" }))).toMatchObject({ course: "Design" });
  });

  it("rejects changing to another student's email", async () => {
    await make(1);
    const b = await make(2);
    await expect(updateStudent(db, b.id, parse(1))).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it("returns undefined when the student does not exist", async () => {
    expect(await updateStudent(db, 2_147_483_647, parse(1))).toBeUndefined();
  });
});

describe("delete", () => {
  it("deletes a student", async () => {
    const s = await make(1);
    expect(await deleteStudent(db, s.id)).toBe(true);
    expect(await getStudent(db, s.id)).toBeUndefined();
  });

  it("returns false when the student does not exist", async () => {
    expect(await deleteStudent(db, 2_147_483_647)).toBe(false);
  });
});

describe("search and filters", () => {
  it("searches name or email (case-insensitive) and combines with filters", async () => {
    const course = `Course-${runId}`;
    await make(1, { full_name: `Findme ${runId} Alpha`, course });
    await make(2, { full_name: `Findme ${runId} Beta`, course, status: "Inactive" });

    expect(emails(await listStudents(db, { search: `FINDME ${runId}` }))).toEqual([email(1), email(2)]);
    expect(emails(await listStudents(db, { search: `${prefix}2` }))).toEqual([email(2)]); // by email
    expect(emails(await listStudents(db, { course }))).toEqual([email(1), email(2)]);
    expect(emails(await listStudents(db, { course, status: "Inactive" }))).toEqual([email(2)]);
    expect(emails(await listStudents(db, { course, search: "alpha" }))).toEqual([email(1)]);
    expect(emails(await listStudents(db, { course: `nope-${runId}` }))).toEqual([]);
  });
});

describe("dashboard", () => {
  it("counts come from stored rows and list the courses", async () => {
    const course = `Course-${runId}`;
    await make(1, { course, status: "Inactive" });
    const stats = await getDashboard(db);
    expect(stats.total).toBe(stats.active + stats.inactive);
    expect(stats.inactive).toBeGreaterThanOrEqual(1);
    expect(stats.courses).toContain(course);
  });
});

describe("pagination and sorting", () => {
  it("pages through results, reports totals, and never overlaps pages", async () => {
    for (const n of [1, 2, 3, 4, 5]) await make(n);
    const q = { search: prefix, pageSize: 2 };
    const p1 = await listStudents(db, { ...q, page: 1 });
    const p2 = await listStudents(db, { ...q, page: 2 });
    expect(p1).toMatchObject({ total: 5, totalPages: 3, page: 1, pageSize: 2 });
    expect(p1.items).toHaveLength(2);
    expect((await listStudents(db, { ...q, page: 3 })).items).toHaveLength(1);
    expect((await listStudents(db, { ...q, page: 4 })).items).toHaveLength(0); // past the end
    expect(new Set([...p1.items, ...p2.items].map((s) => s.id)).size).toBe(4);
  });

  it("sorts by the requested field and direction", async () => {
    await make(1, { full_name: `N-${runId}-b` });
    await make(2, { full_name: `N-${runId}-a` });
    await make(3, { full_name: `N-${runId}-c` });
    const last = async (order) =>
      (await listStudents(db, { search: prefix, sort: "full_name", order })).items.map((s) => s.full_name.slice(-1));
    expect(await last("asc")).toEqual(["a", "b", "c"]);
    expect(await last("desc")).toEqual(["c", "b", "a"]);
  });
});
