import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

/**
 * Database Client
 * Singleton instance for all database operations
 */

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const client = postgres(connectionString)
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
