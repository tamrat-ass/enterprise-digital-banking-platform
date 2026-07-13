import { NextRequest, NextResponse } from "next/server"
import { RBACService } from "@/lib/services/rbac.service"
import { requirePermission, successResponse, errorResponse, withErrorHandling } from "@/lib/api-utils"

/**
 * GET /api/rbac/roles/[id]
 * Get a specific role with permissions
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { error } = await requirePermission(req, "users:view")
    if (error) return error

    const { id } = await params

    try {
      const role = await RBACService.getRole(id)
      return successResponse(role)
    } catch (err) {
      console.error('[Role Details API] Error fetching role:', err)
      return errorResponse(err instanceof Error ? err.message : 'Failed to fetch role', 500)
    }
  }
)

/**
 * PATCH /api/rbac/roles/[id]
 * Update a role
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { error } = await requirePermission(req, "users:admin")
    if (error) return error

    const { id } = await params

    try {
      const body = await req.json()
      const { name, description, level, permissionIds } = body

      const role = await RBACService.updateRole(id, {
        name,
        description,
        level,
        permissionIds,
      })

      return successResponse(role)
    } catch (err) {
      console.error('[Role Details API] Error updating role:', err)
      return errorResponse(err instanceof Error ? err.message : 'Failed to update role', 500)
    }
  }
)
