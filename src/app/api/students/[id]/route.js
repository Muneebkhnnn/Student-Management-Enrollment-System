import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fail, invalidId, notFound, parseId, readJson } from "@/lib/http";
import { DuplicateEmailError, deleteStudent, getStudent, updateStudent } from "@/lib/students";
import { fieldErrors, studentSchema } from "@/lib/validation";

// In Next.js 15+ `params` is a Promise.
export async function GET(_req, { params }) {
  const id = parseId((await params).id);
  if (id === null) return invalidId();
  try {
    const student = await getStudent(getDb(), id);
    return student ? NextResponse.json({ data: student }) : notFound(id);
  } catch (err) {
    console.error(err);
    return fail(500, "INTERNAL_ERROR", "Could not load the student.");
  }
}

// Full replacement: the body has the same shape as on create.
export async function PUT(request, { params }) {
  const id = parseId((await params).id);
  if (id === null) return invalidId();

  const { body, error } = await readJson(request);
  if (error) return error;

  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) {
    return fail(422, "VALIDATION_ERROR", "Some fields need attention.", fieldErrors(parsed.error));
  }

  try {
    const student = await updateStudent(getDb(), id, parsed.data);
    return student ? NextResponse.json({ data: student }) : notFound(id);
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return fail(409, "DUPLICATE_EMAIL", err.message, { email: err.message });
    }
    console.error(err);
    return fail(500, "INTERNAL_ERROR", "Could not update the student.");
  }
}

export async function DELETE(_req, { params }) {
  const id = parseId((await params).id);
  if (id === null) return invalidId();
  try {
    const deleted = await deleteStudent(getDb(), id);
    return deleted ? new Response(null, { status: 204 }) : notFound(id);
  } catch (err) {
    console.error(err);
    return fail(500, "INTERNAL_ERROR", "Could not delete the student.");
  }
}
