import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * GET /api/rbac/permissions
 * List all permissions
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requirePermission(req, "users:view")
  if (error) return error

  try {
    const groupByModule = req.nextUrl.searchParams.get("groupBy") === "module"
    
    if (groupByModule) {
      const permissions = await RBACService.getPermissionsByModule()
      return successResponse(permissions)
    }

    const permissions = await RBACService.getAllPermissions()
    return successResponse(permissions)
  } catch (err) {
    console.error('[Permissions API] Error fetching permissions:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to fetch permissions', 500)
  }
})
