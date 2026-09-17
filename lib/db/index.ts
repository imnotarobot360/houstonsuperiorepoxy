import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/*
  One pool for the process. Next.js hot-reloads modules in development, so
  without the global cache every edit would leak another pool until Neon
  refused new connections.
*/
const globalForDb = globalThis as unknown as { __leadPool?: Pool }

export const pool =
  globalForDb.__leadPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Lead volume is low; a small ceiling is plenty and keeps us well under
    // Neon's connection limit when several serverless instances are warm.
    max: 5,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.__leadPool = pool

export const db = drizzle(pool, { schema })
