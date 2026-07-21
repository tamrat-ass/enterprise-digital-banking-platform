import { NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

/**
 * POST /api/admin/fix-roles-schema
 * Add missing columns to roles table if they don't exist
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Fix Roles Schema] Starting...')

    // Add is_system column if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE roles
        ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false
      `)
      console.log('[Fix Roles Schema] Added is_system column')
    } catch (err) {
      console.log('[Fix Roles Schema] is_system column may already exist:', err)
    }

    // Add is_active column if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE roles
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true
      `)
      console.log('[Fix Roles Schema] Added is_active column')
    } catch (err) {
      console.log('[Fix Roles Schema] is_active column may already exist:', err)
    }

    // Add created_at column if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE roles
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      `)
      console.log('[Fix Roles Schema] Added created_at column')
    } catch (err) {
      console.log('[Fix Roles Schema] created_at column may already exist:', err)
    }

    // Add updated_at column if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE roles
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      `)
      console.log('[Fix Roles Schema] Added updated_at column')
    } catch (err) {
      console.log('[Fix Roles Schema] updated_at column may already exist:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Roles table schema fixed successfully',
    })
  } catch (err) {
    console.error('[Fix Roles Schema] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fix roles schema',
      },
      { status: 500 }
    )
  }
}
