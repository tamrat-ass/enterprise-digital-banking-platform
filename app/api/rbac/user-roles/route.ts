import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * POST /api/rbac/user-roles
 * Assign a role to a user
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requirePermission(req, "users.update")
  if (error) return error

  try {
    const body = await req.json()
    const { userId, roleId } = body

    if (!userId || !roleId) {
      return errorResponse('userId and roleId are required', 400)
    }

    const result = await RBACService.assignRoleToUser(userId, roleId)
    
    console.log('[User Roles API] Role assigned successfully:', {
      userId,
      roleId,
      newPermissions: result.permissions?.length || 0
    })
    
    // Include a flag that tells the client to refresh the session
    const response = {
      ...result,
      _requireSessionRefresh: true
    }
    
    return successResponse(response, 201)
  } catch (err) {
    console.error('[User Roles API] Error assigning role:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to assign role', 500)
  }
})

