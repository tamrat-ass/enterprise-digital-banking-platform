import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * GET /api/rbac/roles
 * List all roles with their permissions
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requirePermission(req, "users:view")
  if (error) return error

  try {
    const roles = await RBACService.getAllRoles()
    return successResponse(roles)
  } catch (err) {
    console.error('[Roles API] Error fetching roles:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to fetch roles', 500)
  }
})

/**
 * POST /api/rbac/roles
 * Create a new role
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requirePermission(req, "users:admin")
  if (error) return error

  try {
    const body = await req.json()
    const { name, key, description, level, permissionIds } = body

    if (!name || !key) {
      return errorResponse('name and key are required', 400)
    }

    const role = await RBACService.createRole({
      name,
      key,
      description,
      level,
      permissionIds: permissionIds || [],
    })

    return successResponse(role, 201)
  } catch (err) {
    console.error('[Roles API] Error creating role:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to create role', 500)
  }
})
