import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

/**
 * Database Client
 * Singleton instance for all database operations
 * CRITICAL: Connection pool is severely limited to prevent database overload
 */

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

/**
 * Connection pooling configuration - TUNED FOR PRODUCTION LOAD
 * 
 * Previous settings were too conservative (max: 5) causing connection exhaustion
 * under moderate load. New settings balance safety with performance.
 * 
 * Note: There's a separate pool in lib/auth.ts for Better Auth (max: 10)
 * Total available connections: 30 (should be sufficient for ~20 concurrent users)
 */
const client = postgres(connectionString, {
  max: parseInt(process.env.DB_POOL_MAX || '20'),           // Up from 5 - 4x more concurrency
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30'),    // Up from 5 - keep connections warm
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10'), // Up from 3 - more generous timeout
  max_lifetime: 60 * 60,                                    // Connections max 1 hour
  backoff: () => 100,                                       // Retry backoff
})

export const db = drizzle(client, { schema })

/**
 * Database health check utility
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}

/**
 * Database cleanup (for testing or migrations)
 */
export async function closeDatabase(): Promise<void> {
  await client.end()
}

export default db
