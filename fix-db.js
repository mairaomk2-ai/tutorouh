import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Use the same database URL logic as the app
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('DATABASE_URL not found, constructing from components...');
  const { PGUSER, PGHOST, PGPORT, PGDATABASE, PGPASSWORD } = process.env;
  databaseUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  console.log('Constructed DATABASE_URL:', databaseUrl);
}

const sql = neon(databaseUrl);

async function fixDatabase() {
  try {
    console.log('Adding monthly_fee column...');
    await sql`ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(8,2) DEFAULT 5000.00`;
    console.log('✓ Successfully added monthly_fee column');
    
    console.log('Updating existing teacher profiles...');
    await sql`UPDATE teacher_profiles SET monthly_fee = 5000.00 WHERE monthly_fee IS NULL`;
    console.log('✓ Updated existing teacher profiles with default fee');
    
    console.log('Testing query...');
    const result = await sql`SELECT COUNT(*) as count FROM teacher_profiles WHERE monthly_fee IS NOT NULL`;
    console.log('✓ Teachers with monthly_fee:', result[0]?.count || 0);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDatabase();