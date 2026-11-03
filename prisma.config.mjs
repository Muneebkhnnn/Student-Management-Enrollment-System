import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // CLI only (migrate, studio). Falls back to "" so `prisma generate` works without a .env.
    url: process.env.DIRECT_URL ?? "",
  },
});
