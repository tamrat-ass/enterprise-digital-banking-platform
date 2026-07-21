import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { RBACService } from "@/lib/services/rbac.service"
import { db } from "@/lib/db"
import { userRoles, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

/**
 * GET /api/admin/diagnose-permissions
 * Debug endpoint to diagnose permission issues
 */
export async function GET(req: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({
        error: "Not authenticated",
        currentUser: null
      }, { status: 401 })
    }

    // Get user roles from database
    const userRolesFromDb = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, currentUser.id))

    // Get user roles with full details
    const enrichedRoles = await Promise.all(
      userRolesFromDb.map(ur => RBACService.getRole(ur.roleId))
    )

    // Get user from database
    const userFromDb = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id))

    return NextResponse.json({
      success: true,
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        roleId: currentUser.roleId,
        roleName: currentUser.roleName,
        permissions: currentUser.permissions,
        permissionCount: currentUser.permissions.length
      },
      rolesFromDatabase: {
        count: userRolesFromDb.length,
        roles: userRolesFromDb
      },
      enrichedRoles: enrichedRoles.map(role => ({
        id: role.id,
        name: role.name,
        permissionCount: role.permissionCount,
        permissions: role.permissions.map((p: any) => `${p.module}.${p.permissionKey}`).join(", ")
      })),
      userRecord: userFromDb[0] ? {
        id: userFromDb[0].id,
        name: userFromDb[0].name,
        email: userFromDb[0].email,
        status: userFromDb[0].status
      } : null,
      diagnostics: {
        hasRole: !!currentUser.roleId,
        roleAssigned: userRolesFromDb.length > 0,
        hasPermissions: currentUser.permissions.length > 0,
        expectedPermissions: currentUser.roleId ? enrichedRoles[0]?.permissions.map((p: any) => `${p.module}.${p.permissionKey}`) : []
      }
    }, { status: 200 })
  } catch (err) {
    console.error('[diagnose-permissions] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to diagnose',
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 })
  }
}
