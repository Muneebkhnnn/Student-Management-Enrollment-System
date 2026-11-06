import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fail, readJson } from "@/lib/http";
import { DuplicateEmailError, createStudent, listStudents } from "@/lib/students";
import { fieldErrors, listQuerySchema, studentSchema } from "@/lib/validation";

export async function GET(request) {
  const raw = Object.fromEntries([...new URL(request.url).searchParams].filter(([, v]) => v !== ""));
  const query = listQuerySchema.safeParse(raw);
  if (!query.success) {
    return fail(400, "INVALID_QUERY", "Invalid search, filter, paging, or sort parameter.", fieldErrors(query.error));
  }
  try {
    const { items, ...meta } = await listStudents(getDb(), query.data);
    return NextResponse.json({ data: items, meta });
  } catch (err) {
    console.error(err);
    return fail(500, "INTERNAL_ERROR", "Could not load students.");
  }
}

export async function POST(request) {
  const { body, error } = await readJson(request);
  if (error) return error;

  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) {
    return fail(422, "VALIDATION_ERROR", "Some fields need attention.", fieldErrors(parsed.error));
  }

  try {
    const student = await createStudent(getDb(), parsed.data);
    return NextResponse.json(
      { data: student },
      { status: 201, headers: { Location: `/api/students/${student.id}` } },
    );
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return fail(409, "DUPLICATE_EMAIL", err.message, { email: err.message });
    }
    console.error(err);
    return fail(500, "INTERNAL_ERROR", "Could not save the student.");
  }
}
