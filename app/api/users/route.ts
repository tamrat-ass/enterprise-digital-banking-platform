import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { requirePermission, errorResponse } from "@/lib/api-utils"

/**
 * GET /api/users
 * Get list of users for sharing
 */
export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, "documents:view")
  if (error) return error

  try {
    console.log('[Users] Fetching users list')

    // Get all users from database using raw SQL
    const usersResult = await db.execute(sql`
      SELECT id, name, email
      FROM "user"
      ORDER BY name ASC
      LIMIT 100
    `)

    const users = (usersResult as any[]).map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email || '',
    }))

    console.log('[Users] Found', users.length, 'users')

    return NextResponse.json({
      status: 'success',
      data: users,
    })
  } catch (err) {
    console.error('[Users] Error fetching users:', err)
    return errorResponse('Failed to fetch users', 500)
  }
}
