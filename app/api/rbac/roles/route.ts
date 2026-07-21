import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * GET /api/rbac/roles
 * List all roles with their permissions
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  console.log('[Roles API] GET request received')
  console.log('[Roles API] Headers:', {
    cookie: req.headers.get('cookie') ? 'present' : 'missing',
    authorization: req.headers.get('authorization') ? 'present' : 'missing',
  })
  
  const { error, user } = await requirePermission(req, "users.view")
  if (error) {
    console.log('[Roles API] Permission check failed, returning 401/403')
    return error
  }

  console.log('[Roles API] User authenticated:', user?.name)

  try {
    console.log('[Roles API] Fetching all roles...')
    const roles = await RBACService.getAllRoles()
    console.log('[Roles API] Successfully fetched', roles.length, 'roles')
    return successResponse(roles)
  } catch (err) {
    console.error('[Roles API] Error fetching roles:', err)
    console.error('[Roles API] Stack trace:', err instanceof Error ? err.stack : 'No stack trace')
    return errorResponse(err instanceof Error ? err.message : 'Failed to fetch roles', 500)
  }
})

/**
 * POST /api/rbac/roles
 * Create a new role
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requirePermission(req, "users.create")
  if (error) return error

  try {
    const body = await req.json()
    const { name, description, permissionIds } = body

    if (!name) {
      return errorResponse('name is required', 400)
    }

    const role = await RBACService.createRole({
      name,
      description,
      permissionIds: permissionIds || [],
    })

    return successResponse(role, 201)
  } catch (err) {
    console.error('[Roles API] Error creating role:', err)
    return errorResponse(err instanceof Error ? err.message : 'Failed to create role', 500)
  }
})

