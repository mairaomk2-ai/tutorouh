import dotenv from "dotenv";
// Load environment variables
dotenv.config({ override: true });

import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use the new PostgreSQL database URL from environment
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Fallback construction if DATABASE_URL is not available
  const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT } = process.env;
  if (PGHOST && PGDATABASE && PGUSER && PGPASSWORD) {
    databaseUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT || 5432}/${PGDATABASE}?sslmode=require`;
    console.log("✓ Constructed DATABASE_URL from PostgreSQL components");
  } else {
    throw new Error("❌ No DATABASE_URL or PostgreSQL connection details found");
  }
}

console.log("✓ Using new PostgreSQL database connection");

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });