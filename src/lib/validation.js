import { z } from "zod";
import { STATUSES } from "./constants";

const required = (label) => z.string({ error: `${label} is required` }).trim();

const digitCount = (v) => v.replace(/\D/g, "").length;

const isRealDate = (v) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v &&
  Number(v.slice(0, 4)) >= 1900 &&
  Number(v.slice(0, 4)) <= 2100;

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
  enrollment_date: required("Enrollment date").refine(isRealDate, "Enter a valid date between 1900 and 2100 (YYYY-MM-DD)"),
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

export const SORT_FIELDS = ["created_at", "full_name", "course", "enrollment_date", "status"];

/** Query string for GET /api/students. Empty values are treated as "not set" by the route. */
export const listQuerySchema = z.object({
  search: z.string().trim().max(100, "Search is too long").optional(),
  status: z.enum(STATUSES, { error: "Status must be Active or Inactive" }).optional(),
  course: z.string().trim().max(120, "Course name is too long").optional(),
  page: z.coerce
    .number({ error: "Page must be a number" })
    .int("Page must be a whole number")
    .min(1, "Page must be 1 or more")
    .max(1_000_000, "Page is too large")
    .default(1),
  pageSize: z.coerce
    .number({ error: "Page size must be a number" })
    .int("Page size must be a whole number")
    .min(1, "Page size must be between 1 and 50")
    .max(50, "Page size must be between 1 and 50")
    .default(10),
  sort: z.enum(SORT_FIELDS, { error: `Sort must be one of: ${SORT_FIELDS.join(", ")}` }).default("created_at"),
  order: z.enum(["asc", "desc"], { error: "Order must be asc or desc" }).default("desc"),
});
