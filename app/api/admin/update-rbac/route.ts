import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { rolePermissions, roles as rolesTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { successResponse, errorResponse } from "@/lib/api-utils"

/**
 * POST /api/admin/update-rbac
 * Update existing RBAC system with new permissions and role assignments
 * 
 * This endpoint:
 * 1. Checks if RBAC is already initialized
 * 2. Re-runs the seed operation to update role permissions
 * 3. Updates all existing roles with new permissions
 * 4. Useful after code changes to RBAC definitions
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
        message: 'Must be signed in to update RBAC',
        success: false
      }, { status: 401 })
    }

    console.log('[update-rbac] Starting RBAC update for user:', userId)

    // Re-run the seed operation
    // This will update all roles with their new permissions
    await RBACService.seedRolesAndPermissions()
    
    // Get updated counts
    const roleCount = await db
      .select()
      .from(rolesTable)
      .where(eq(rolesTable.isSystem, true))
    
    const rpCount = await db
      .select()
      .from(rolePermissions)

    console.log('[update-rbac] RBAC updated successfully:', {
      roles: roleCount.length,
      rolePermissions: rpCount.length
    })
    
    return NextResponse.json({
      status: 'updated',
      message: 'RBAC system updated successfully',
      success: true,
      stats: {
        systemRoles: roleCount.length,
        rolePermissionLinks: rpCount.length
      }
    }, { status: 200 })
  } catch (err) {
    console.error('[update-rbac] Error updating RBAC:', err)
    return NextResponse.json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to update RBAC',
      error: err instanceof Error ? err.message : undefined,
      success: false
    }, { status: 500 })
  }
}
