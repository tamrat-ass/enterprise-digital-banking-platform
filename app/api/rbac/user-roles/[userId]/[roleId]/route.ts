import { NextRequest } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * DELETE /api/rbac/user-roles/[userId]/[roleId]
 * Remove a role from a user
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ userId: string; roleId: string }> }) => {
    const { error } = await requirePermission(req, "users:admin")
    if (error) return error

    const { userId, roleId } = await params

    try {
      if (!userId || !roleId) {
        return errorResponse('userId and roleId are required', 400)
      }

      const result = await RBACService.removeRoleFromUser(userId, roleId)
      return successResponse(result)
    } catch (err) {
      console.error('[User Roles API] Error removing role:', err)
      return errorResponse(err instanceof Error ? err.message : 'Failed to remove role', 500)
    }
  }
)
