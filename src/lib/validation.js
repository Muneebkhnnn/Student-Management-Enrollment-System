import { z } from "zod";
import { STATUSES } from "./constants";

const required = (label) => z.string({ error: `${label} is required` }).trim();

const digitCount = (v) => v.replace(/\D/g, "").length;

const isRealDate = (v) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;

export const studentSchema = z.object({
  full_name: required("Full name").min(1, "Full name is required").max(120, "Full name is too long"),
  email: required("Email")
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .toLowerCase()
    .pipe(z.email("Enter a valid email address")),
  phone_number: required("Phone number")
    .min(1, "Phone number is required")
    .refine(
      (v) => /^\+?[0-9\s\-()]+$/.test(v) && digitCount(v) >= 7 && digitCount(v) <= 15,
      "Enter a valid phone number (7–15 digits, may start with +)",
    ),
  course: required("Course").min(1, "Course is required").max(120, "Course name is too long"),
  enrollment_date: required("Enrollment date").refine(isRealDate, "Enter a valid date (YYYY-MM-DD)"),
  status: z.enum(STATUSES, { error: "Status must be Active or Inactive" }).default("Active"),
});

/** One message per field (the first problem found): { field: "message" } */
export function fieldErrors(err) {
  const out = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Query string for GET /api/students. Empty values are treated as "not set". */
export const listQuerySchema = z.object({
  search: z.string().trim().max(100, "Search is too long").optional(),
  status: z.enum(STATUSES, { error: "Status must be Active or Inactive" }).optional(),
  course: z.string().trim().max(120, "Course name is too long").optional(),
});
