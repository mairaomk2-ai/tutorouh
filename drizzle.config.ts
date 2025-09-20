import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  strict: false, // Disable confirmation prompts for non-interactive use
  verbose: true, // Show SQL statements
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
