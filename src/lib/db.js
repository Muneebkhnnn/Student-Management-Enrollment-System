import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/** Build a client for a connection string (used by the app and by tests). */
export function createPrisma(connectionString) {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
  const adapter = new PrismaPg({
    connectionString,
    // Supabase requires TLS. This encrypts but does not verify the server certificate;
    // see README "Known limitations". Don't put sslmode in DATABASE_URL: it would override this.
    ssl: local ? undefined : { rejectUnauthorized: false },
  });
  return new PrismaClient({ adapter });
}

const g = globalThis;

/** Shared client for the app (survives dev hot reloads). */
export function getDb() {
  if (!g.__prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    g.__prisma = createPrisma(url);
  }
  return g.__prisma;
}
