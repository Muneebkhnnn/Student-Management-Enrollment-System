export class DuplicateEmailError extends Error {
  constructor() {
    super("A student with this email already exists.");
    this.name = "DuplicateEmailError";
  }
}

// The API speaks plain strings (YYYY-MM-DD and ISO timestamps), not Date objects.
const toStudent = (r) => ({
  ...r,
  enrollment_date: r.enrollment_date.toISOString().slice(0, 10),
  created_at: r.created_at.toISOString(),
  updated_at: r.updated_at.toISOString(),
});

const toDate = (ymd) => new Date(`${ymd}T00:00:00.000Z`);

// Prisma error codes: P2002 = unique constraint failed, P2025 = record not found.
const code = (err) => err?.code;

export async function createStudent(db, input) {
  try {
    const row = await db.student.create({ data: { ...input, enrollment_date: toDate(input.enrollment_date) } });
    return toStudent(row);
  } catch (err) {
    // The database unique index is the source of truth; we only translate its failure.
    if (code(err) === "P2002") throw new DuplicateEmailError();
    throw err;
  }
}

export async function getStudent(db, id) {
  const row = await db.student.findUnique({ where: { id } });
  return row ? toStudent(row) : undefined;
}

/**
 * Search matches name OR email (case-insensitive substring); status/course filters are ANDed with it.
 * Sorting always adds `id` as a tie-breaker so pages never overlap or skip rows.
 */
export async function listStudents(
  db,
  { search, status, course, page = 1, pageSize = 10, sort = "created_at", order = "desc" } = {},
) {
  const where = {};
  if (status) where.status = status;
  if (course) where.course = course;
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  // One transaction so the count and the rows come from the same snapshot.
  const [total, rows] = await db.$transaction([
    db.student.count({ where }),
    db.student.findMany({
      where,
      orderBy: [{ [sort]: order }, { id: order }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { items: rows.map(toStudent), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

/** Returns the updated student, or undefined if it doesn't exist. */
export async function updateStudent(db, id, input) {
  try {
    const row = await db.student.update({
      where: { id },
      data: { ...input, enrollment_date: toDate(input.enrollment_date) },
    });
    return toStudent(row);
  } catch (err) {
    if (code(err) === "P2002") throw new DuplicateEmailError();
    if (code(err) === "P2025") return undefined;
    throw err;
  }
}

/** Returns true if a row was deleted, false if it didn't exist. */
export async function deleteStudent(db, id) {
  try {
    await db.student.delete({ where: { id } });
    return true;
  } catch (err) {
    if (code(err) === "P2025") return false;
    throw err;
  }
}

/** Counts come from the stored rows (one grouped query), never hard-coded. */
export async function getDashboard(db) {
  const [groups, courseRows] = await Promise.all([
    db.student.groupBy({ by: ["status"], _count: { _all: true } }),
    db.student.findMany({ distinct: ["course"], select: { course: true }, orderBy: { course: "asc" } }),
  ]);
  const count = (s) => groups.find((g) => g.status === s)?._count._all ?? 0;
  const active = count("Active");
  const inactive = count("Inactive");
  return { total: active + inactive, active, inactive, courses: courseRows.map((r) => r.course) };
}
