import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fail } from "@/lib/http";
import { getDashboard } from "@/lib/students";

export async function GET() {
  try {
    return NextResponse.json({ data: await getDashboard(getDb()) });
  } catch (err) {
    console.error(err);
    return fail(500, "INTERNAL_ERROR", "Could not load dashboard counts.");
  }
}
