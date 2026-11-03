-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Active', 'Inactive');

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "enrollment_date" DATE NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_status_course_idx" ON "students"("status", "course");

-- Hand-written: rules Prisma's schema language cannot express.
-- Requiring a lowercase email makes the plain UNIQUE index effectively case-insensitive.
ALTER TABLE "students"
  ADD CONSTRAINT "students_full_name_not_blank" CHECK (length(btrim("full_name")) > 0),
  ADD CONSTRAINT "students_email_lowercase" CHECK ("email" = lower("email") AND length(btrim("email")) > 0),
  ADD CONSTRAINT "students_phone_not_blank" CHECK (length(btrim("phone_number")) > 0),
  ADD CONSTRAINT "students_course_not_blank" CHECK (length(btrim("course")) > 0);

-- Hand-written: Supabase exposes public tables through its REST API. Enabling RLS with no
-- policies blocks that path. The app connects as the `postgres` role, which bypasses RLS.
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
