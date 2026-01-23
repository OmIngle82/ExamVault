import { Pool } from 'pg';

// Use a global variable to store the pool instance in development
// to avoid exhausting database connections during hot reloads.
const globalForDb = global as unknown as { db: Pool };

export const db =
  globalForDb.db ||
  new Pool({
    connectionString: process.env.POSTGRES_URL,
    // Neon typically uses the connection string parameters, but explicit ssl: true helps in some obscure node configs
    // We defer to the connection string params mostly.
  });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

export default db;
