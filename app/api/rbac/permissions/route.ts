import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * GET /api/rbac/permissions
 * List all permissions (excludes departments module)
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requirePermission(req, "users.view")
  if (error) return error

  try {
    const groupByModule = req.nextUrl.searchParams.get("groupBy") === "module"
    
    if (groupByModule) {
      const permissions = await RBACService.getPermissionsByModule()
      return successResponse(permissions)
    }

    const allPermissions = await RBACService.getAllPermissions()
    // Filter out departments module - not used in permission assignment
    const filteredPermissions = allPermissions.filter((perm: any) => perm.module !== 'departments')
    return successResponse(filteredPermissions)
  } catch (err) {
    console.error('[Permissions API] Error fetching permissions:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to fetch permissions', 500)
  }
})

