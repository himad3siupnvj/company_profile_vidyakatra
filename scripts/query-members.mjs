import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();
const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);
async function run() {
  const res = await db.execute('SELECT id, name, position, "avatarUrl", "organizationalUnitId" FROM members LIMIT 10');
  console.log(res);
  process.exit(0);
}
run();
