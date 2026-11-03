import { describe, expect, it } from "vitest";
import { fieldErrors, studentSchema } from "../src/lib/validation";

const valid = {
  full_name: "Asha Verma",
  email: "asha@example.com",
  phone_number: "+91 98765 43210",
  course: "Data Analytics",
  enrollment_date: "2026-11-03",
  status: "Active",
};

describe("validation", () => {
  it("accepts a valid student and defaults status to Active", () => {
    const { status, ...noStatus } = valid;
    const r = studentSchema.safeParse(noStatus);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("Active");
  });

  it("trims and lowercases email", () => {
    expect(studentSchema.parse({ ...valid, email: "  Asha@Example.COM " }).email).toBe("asha@example.com");
  });

  it.each([
    ["full_name", "   "],
    ["email", "not-an-email"],
    ["phone_number", "abc"],
    ["phone_number", "123"],
    ["course", ""],
    ["enrollment_date", "2026-02-31"],
    ["enrollment_date", "03/11/2026"],
    ["status", "Pending"],
  ])("rejects invalid %s (%j)", (field, value) => {
    const r = studentSchema.safeParse({ ...valid, [field]: value });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)).toHaveProperty(field);
  });

  it("reports every missing required field", () => {
    const r = studentSchema.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(Object.keys(fieldErrors(r.error))).toEqual(
        expect.arrayContaining(["full_name", "email", "phone_number", "course", "enrollment_date"]),
      );
    }
  });
});
