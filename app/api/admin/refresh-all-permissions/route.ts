import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { userRoles, user as userTable } from "@/lib/db/schema"

/**
 * POST /api/admin/refresh-all-permissions
 * 
 * This endpoint refreshes permissions for ALL users by:
 * 1. Re-seeding the RBAC system (updates all role permissions)
 * 2. Lists all affected users so they know to log out and back in
 * 
 * Use this when:
 * - Permissions were added/updated in the code
 * - Existing users need fresh permission assignments
 * - New roles were added
 * 
 * How it works:
 * - Re-runs the seed operation (idempotent, safe)
 * - Updates all roles and their permissions
 * - Users will get fresh permissions on next request
 * - Or they can manually refresh by signing out/in
 */
export async function POST(req: NextRequest) {
  try {
    // Get current user (must be authenticated)
    let userId: string | null = null
    try {
      userId = await getUserId()
    } catch {
      userId = null
    }
    
    if (!userId) {
      return NextResponse.json({
        status: 'not_authenticated',
        message: 'Must be signed in',
        success: false
      }, { status: 401 })
    }

    console.log('[refresh-all-permissions] Starting refresh for user:', userId)

    // Get all users with roles so we can tell them to refresh
    const usersWithRoles = await db
      .select({
        userId: userRoles.userId,
        userName: userTable.name,
        userEmail: userTable.email
      })
      .from(userRoles)
      .innerJoin(userTable, eq(userRoles.userId, userTable.id))

    console.log('[refresh-all-permissions] Found', usersWithRoles.length, 'users with roles')

    // Re-seed RBAC (updates roles and their permissions)
    console.log('[refresh-all-permissions] Re-seeding RBAC system...')
    await RBACService.seedRolesAndPermissions()

    console.log('[refresh-all-permissions] RBAC re-seeded successfully')

    return NextResponse.json({
      status: 'success',
      message: 'RBAC system refreshed - all roles updated with latest permissions',
      success: true,
      refreshedUsers: {
        count: usersWithRoles.length,
        users: usersWithRoles.map(u => ({
          id: u.userId,
          name: u.userName,
          email: u.userEmail
        }))
      },
      nextSteps: {
        option1: 'Users will automatically get new permissions on their next action',
        option2: 'Users can sign out and back in to refresh immediately',
        option3: 'Admin can notify users to refresh: Go to /api/auth/refresh-session'
      }
    }, { status: 200 })
  } catch (err) {
    console.error('[refresh-all-permissions] Error:', err)
    return NextResponse.json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to refresh permissions',
      error: err instanceof Error ? err.message : undefined,
      success: false
    }, { status: 500 })
  }
}

import { eq } from "drizzle-orm"
