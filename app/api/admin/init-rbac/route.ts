import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { getCurrentUser, getUserId } from "@/lib/session"
import { successResponse, errorResponse } from "@/lib/api-utils"
import { db } from "@/lib/db"
import { permissions, rolePermissions } from "@/lib/db/schema"

/**
 * GET /api/admin/init-rbac
 * Initialize RBAC system - seed roles and permissions if not already done
 * 
 * This endpoint:
 * 1. Checks if RBAC is already initialized
 * 2. If not, creates all permissions and system roles
 * 3. Returns current status
 */
export async function GET(req: NextRequest) {
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
        message: 'Must be signed in to initialize RBAC',
        initialized: false
      }, { status: 401 })
    }

    console.log('[init-rbac] Checking RBAC status for user:', userId)

    // Check if permissions already exist
    const existingPerms = await db.select().from(permissions).limit(1)
    
    if (existingPerms.length > 0) {
      // Check role_permissions
      const existingRolePerms = await db.select().from(rolePermissions).limit(1)
      
      if (existingRolePerms.length > 0) {
        console.log('[init-rbac] RBAC already initialized')
        return NextResponse.json({
          status: 'already_initialized',
          message: 'RBAC system is already initialized',
          initialized: true,
          permissionCount: await db.select().from(permissions),
          rolePermissionCount: await db.select().from(rolePermissions)
        }, { status: 200 })
      }
    }

    console.log('[init-rbac] Starting RBAC initialization...')

    // Run the seed operation
    await RBACService.seedRolesAndPermissions()
    
    // Verify it worked
    const permCount = await db.select().from(permissions)
    const rpCount = await db.select().from(rolePermissions)

    console.log('[init-rbac] RBAC initialized successfully:', {
      permissions: permCount.length,
      rolePermissions: rpCount.length
    })
    
    return NextResponse.json({
      status: 'initialized',
      message: 'RBAC system initialized successfully',
      initialized: true,
      permissionCount: permCount.length,
      rolePermissionCount: rpCount.length
    }, { status: 200 })
  } catch (err) {
    console.error('[init-rbac] Error initializing RBAC:', err)
    return NextResponse.json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to initialize RBAC',
      error: err instanceof Error ? err.message : undefined,
      initialized: false
    }, { status: 500 })
  }
}
