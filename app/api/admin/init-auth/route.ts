import { NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

/**
 * GET /api/admin/init-auth
 * Initialize Better Auth database tables
 * This creates all necessary auth tables for the application
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Admin] Initializing Better Auth tables...')

    // Create user table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        emailVerified BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('[Admin] user table created/verified')

    // Create session table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        expiresAt TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ipAddress TEXT,
        userAgent TEXT,
        userId TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
      )
    `)
    console.log('[Admin] session table created/verified')

    // Create account table for OAuth/external auth
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        providerId TEXT NOT NULL,
        userId TEXT NOT NULL,
        accessToken TEXT,
        refreshToken TEXT,
        idToken TEXT,
        accessTokenExpiresAt TIMESTAMP,
        refreshTokenExpiresAt TIMESTAMP,
        scope TEXT,
        password TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
      )
    `)
    console.log('[Admin] account table created/verified')

    // Create verification table for email verification
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expiresAt TIMESTAMP NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('[Admin] verification table created/verified')

    return NextResponse.json({
      success: true,
      message: 'Better Auth tables initialized successfully',
      tables: ['user', 'session', 'account', 'verification'],
    }, { status: 200 })
  } catch (err) {
    console.error('[Admin] Error initializing auth tables:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to initialize auth tables',
      },
      { status: 500 }
    )
  }
}


