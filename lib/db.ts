import { Pool } from 'pg';

// Use a global variable to store the pool instance in development
// to avoid exhausting database connections during hot reloads.
const globalForDb = global as unknown as { db: Pool };

export const db =
  globalForDb.db ||
  new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export default db;
