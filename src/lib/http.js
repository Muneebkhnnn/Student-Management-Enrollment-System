import { NextResponse } from "next/server";

const MAX_INT4 = 2_147_483_647;

/** Every error response has the same shape: { error: { code, message, fields? } } */
export function fail(status, code, message, fields) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

export const invalidId = () => fail(400, "INVALID_ID", "Student id must be a positive integer.");
export const notFound = (id) => fail(404, "NOT_FOUND", `No student with id ${id}.`);

/** Returns a valid id (number) or null. */
export function parseId(raw) {
  return /^\d+$/.test(raw) && Number(raw) > 0 && Number(raw) <= MAX_INT4 ? Number(raw) : null;
}

/** Returns { body } on success or { error: Response } when the body isn't valid JSON. */
export async function readJson(request) {
  try {
    return { body: await request.json() };
  } catch {
    return { error: fail(400, "INVALID_JSON", "Request body must be valid JSON.") };
  }
}
