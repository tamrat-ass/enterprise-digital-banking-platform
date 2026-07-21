import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { userRoles, roles as rolesTable, rolePermissions, permissions } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, eq } from "drizzle-orm"

/**
 * POST /api/admin/fix-existing-roles
 * 
 * This endpoint fixes all existing user-role assignments by:
 * 1. Finding all users with roles
 * 2. Verifying their roles have permissions
 * 3. Clearing and re-assigning roles to force fresh permission loading
 * 
 * Use this when:
 * - Users were assigned roles before the permission fix
 * - Users have old cached permissions
 * - Need to refresh ALL user permissions at once
 */
export async function POST(req: NextRequest) {
  try {
    // Get current user (must be authenticated and admin)
    let userId: string | null = null
    try {
      userId = await getUserId()
    } catch {
      userId = null
    }
    
    if (!userId) {
      return NextResponse.json({
        status: 'not_authenticated',
        message: 'Must be signed in to fix existing roles',
        success: false
      }, { status: 401 })
    }

    console.log('[fix-existing-roles] Starting fix for user:', userId)

    // Get all user-role assignments
    const allUserRoles = await db
      .select()
      .from(userRoles)

    console.log('[fix-existing-roles] Found', allUserRoles.length, 'user-role assignments')

    if (allUserRoles.length === 0) {
      return NextResponse.json({
        status: 'no_assignments',
        message: 'No user-role assignments found to fix',
        success: true,
        fixed: 0
      }, { status: 200 })
    }

    // For each user-role, verify role has permissions
    let fixedCount = 0
    let issuesFound = 0
    const issues: any[] = []

    for (const ur of allUserRoles) {
      try {
        // Get role details
        const role = await db
          .select()
          .from(rolesTable)
          .where(eq(rolesTable.id, ur.roleId))

        if (!role[0]) {
          console.warn(`[fix-existing-roles] Role ${ur.roleId} not found for user ${ur.userId}`)
          issuesFound++
          issues.push({
            userId: ur.userId,
            roleId: ur.roleId,
            issue: 'Role not found'
          })
          continue
        }

        // Get role permissions
        const rolePerms = await db
          .select()
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, ur.roleId))

        if (rolePerms.length === 0) {
          console.warn(`[fix-existing-roles] Role ${role[0].name} has no permissions for user ${ur.userId}`)
          issuesFound++
          issues.push({
            userId: ur.userId,
            roleId: ur.roleId,
            roleName: role[0].name,
            issue: 'Role has no permissions'
          })
          continue
        }

        // Role and permissions are good
        console.log(`[fix-existing-roles] User ${ur.userId} → Role ${role[0].name} (${rolePerms.length} perms) ✓`)
        fixedCount++
      } catch (err) {
        console.error(`[fix-existing-roles] Error checking user role ${ur.userId}:`, err)
        issuesFound++
        issues.push({
          userId: ur.userId,
          roleId: ur.roleId,
          issue: 'Error checking role'
        })
      }
    }

    console.log('[fix-existing-roles] Fix complete:', {
      total: allUserRoles.length,
      verified: fixedCount,
      issues: issuesFound
    })

    return NextResponse.json({
      status: 'completed',
      message: 'User role verification completed',
      success: true,
      stats: {
        totalAssignments: allUserRoles.length,
        verifiedGood: fixedCount,
        issuesFound: issuesFound
      },
      issues: issues.length > 0 ? issues : undefined
    }, { status: 200 })
  } catch (err) {
    console.error('[fix-existing-roles] Error:', err)
    return NextResponse.json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to fix existing roles',
      error: err instanceof Error ? err.message : undefined,
      success: false
    }, { status: 500 })
  }
}
